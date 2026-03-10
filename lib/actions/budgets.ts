"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createBudgetSchema, CreateBudgetFormValues, saveBudgetSchema, SaveBudgetValues } from "../validations/budgets";
import { revalidatePath } from "next/cache";
import { getCurrentUF } from "./uf";

type ActionResponse = {
    success: boolean;
    message: string;
    data?: any;
    errors?: any;
};

async function insertAuditLog(supabase: any, budgetId: string, userId: string, action: string, description: string) {
    try {
        await supabase.from("audit_log").insert({
            budget_id: budgetId,
            user_id: userId,
            action: action,
            metadata: { description }
        });
    } catch (e) {
        console.error("Error inserting audit log", e);
    }
}

/**
 * Creates a base draft budget, reserving the next EECC-XX code based on sequence.
 */
export async function createBudget(data: CreateBudgetFormValues): Promise<ActionResponse> {
    try {
        const validatedData = createBudgetSchema.parse(data);
        const supabase = await createSupabaseServerClient();

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            return { success: false, message: "No autorizado." };
        }

        // 1. Get the current sequence value using a raw postgres function (if we had it)
        // Or practically in Supabase without RPC: We can query the max ID, but a Sequence is safer.
        // For now, let's query the latest budget to determine the code for the MVP
        const { data: latestBudget } = await supabase
            .from("budgets")
            .select("code")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        let nextNumber = 1;
        if (latestBudget && latestBudget.code.startsWith("EECC-")) {
            const parts = latestBudget.code.split("-");
            if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
                nextNumber = parseInt(parts[1]) + 1;
            }
        }

        // Format to 2 digits minimum
        const newCode = `EECC-${nextNumber.toString().padStart(2, "0")}`;

        // 2. Fetch current UF (MVP: hardcoded until integration with CMF API)
        const currentUF = 38426.21;

        // 3. Insert budget
        const { data: newBudget, error } = await supabase
            .from("budgets")
            .insert({
                code: newCode,
                client_id: validatedData.client_id,
                project_name: validatedData.project_name,
                project_location: validatedData.project_location,
                global_margin: validatedData.global_margin,
                considerations: validatedData.considerations,
                proposal_duration: validatedData.proposal_duration,
                uf_value_at_creation: currentUF,
                created_by: userData.user.id,
                status: "draft",
                revision: 0
            })
            .select("id")
            .single();

        if (error) {
            console.error("Error creating budget:", error);
            return { success: false, message: error.message };
        }

        await insertAuditLog(supabase, newBudget.id, userData.user.id, "budget_created", "Presupuesto inicializado.");

        revalidatePath("/dashboard");
        revalidatePath("/budgets");

        return {
            success: true,
            message: "Presupuesto creado exitosamente.",
            data: { id: newBudget.id }
        };
    } catch (error: any) {
        if (error.name === "ZodError") {
            return { success: false, message: "Error de validación.", errors: error.errors };
        }
        return { success: false, message: error.message || "Error interno." };
    }
}

/**
 * Saves the entire dynamic draft state of the Budget Builder to Supabase.
 * This deletes old lines and inserts current lines to sync exact state.
 */
export async function saveBudgetDraft(budgetId: string, data: SaveBudgetValues): Promise<ActionResponse> {
    try {
        const validatedData = saveBudgetSchema.parse(data);
        const supabase = await createSupabaseServerClient();

        // Check auth
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return { success: false, message: "No autorizado." };

        // 1. Update root budget metadata
        const { error: budgetError } = await supabase
            .from("budgets")
            .update({
                project_name: validatedData.project_name,
                project_location: validatedData.project_location,
                client_id: validatedData.client_id,
                global_margin: validatedData.global_margin,
                considerations: validatedData.considerations,
                proposal_duration: validatedData.proposal_duration,
                total_uf_final: validatedData.total_uf_final,
            })
            .eq("id", budgetId);

        if (budgetError) return { success: false, message: budgetError.message };

        // Complex save: Sync Partitions and Lines. 
        // For MVP logic: We delete existing partitions/lines for this budget and re-insert 
        // Or we use upsert if they have IDs. We will use a mixed logic since Supabase allows upserting.

        // Let's rely on RPC "upsert_budget_tree" if we had one. 
        // Alternatively, since it's a draft, a safe pattern is deleting all partitions/lines and reinserting the new tree 
        // if user drops lines locally. 
        // For better integrity, we will UPSERT partitions, and then UPSERT lines. 
        // First delete partitions that are not in the payload.

        const activePartitionIds = validatedData.partitions.map(p => p.id).filter(id => id !== undefined);

        if (activePartitionIds.length > 0) {
            await supabase.from("budget_partitions")
                .delete()
                .eq("budget_id", budgetId)
                .not("id", "in", `(${activePartitionIds.join(",")})`);
        } else {
            await supabase.from("budget_partitions")
                .delete()
                .eq("budget_id", budgetId);
        }

        // Processing partitions
        for (const [pIndex, part] of validatedData.partitions.entries()) {
            // Upsert Partition
            const partitionPayload = {
                ...(part.id ? { id: part.id } : {}),
                budget_id: budgetId,
                number: part.number,
                name: part.name,
                sort_order: pIndex,
                is_awarded: part.is_awarded || false
            };

            const { data: savedPartition, error: pError } = await supabase
                .from("budget_partitions")
                .upsert(partitionPayload)
                .select("id")
                .single();

            if (pError || !savedPartition) {
                console.error("Error saving partition:", pError);
                continue;
            }

            // Sync lines for this partition
            const activeLineIds = part.lines.map(l => l.id).filter(id => id !== undefined);
            if (activeLineIds.length > 0) {
                await supabase.from("budget_lines")
                    .delete()
                    .eq("partition_id", savedPartition.id)
                    .not("id", "in", `(${activeLineIds.join(",")})`);
            } else {
                await supabase.from("budget_lines")
                    .delete()
                    .eq("partition_id", savedPartition.id);
            }

            const linesToUpsert = part.lines.map((line, lIndex) => ({
                ...(line.id ? { id: line.id } : {}),
                partition_id: savedPartition.id,
                item_id: line.item_id,
                custom_description: line.custom_description,
                quantity: line.quantity,
                unit: line.unit,
                material_value_clp: line.material_value_clp,
                hh_value_clp: line.hh_value_clp,
                line_margin: line.line_margin,
                sort_order: lIndex
            }));

            if (linesToUpsert.length > 0) {
                await supabase.from("budget_lines").upsert(linesToUpsert);
            }
        }

        // Sync general expenses
        const activeExpenseIds = validatedData.general_expenses.map(e => e.id).filter(id => id !== undefined);

        if (activeExpenseIds.length > 0) {
            await supabase.from("budget_general_expenses")
                .delete()
                .eq("budget_id", budgetId)
                .not("id", "in", `(${activeExpenseIds.join(",")})`);
        } else {
            await supabase.from("budget_general_expenses")
                .delete()
                .eq("budget_id", budgetId);
        }

        const expensesToUpsert = validatedData.general_expenses.map((expense, eIndex) => ({
            ...(expense.id ? { id: expense.id } : {}),
            budget_id: budgetId,
            name: expense.name,
            value_clp: expense.value_clp,
            quantity: expense.quantity,
            allocation: expense.allocation,
            sort_order: eIndex
        }));

        if (expensesToUpsert.length > 0) {
            await supabase.from("budget_general_expenses").upsert(expensesToUpsert);
        }

        await insertAuditLog(supabase, budgetId, userData.user.id, "budget_updated", "Borrador guardado con modificaciones en partidas o condiciones.");

        revalidatePath(`/budgets/${budgetId}`);

        return { success: true, message: "Borrador guardado exitosamente." };

    } catch (error: any) {
        if (error.name === "ZodError") {
            return { success: false, message: "Error de validación.", errors: error.errors };
        }
        return { success: false, message: error.message || "Error interno." };
    }
}

/**
 * Updates the workflow status of a budget (e.g. 'draft' to 'sent').
 * If transitioning to 'sent', it locks in the current UF value.
 */
export async function updateBudgetStatus(budgetId: string, newStatus: string, pdfUrl?: string): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        // Check auth
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return { success: false, message: "No autorizado." };

        const updatePayload: any = {
            status: newStatus,
            updated_at: new Date().toISOString()
        };

        if (newStatus === "sent") {
            const currentUf = await getCurrentUF();
            updatePayload.uf_value_at_send = currentUf;
            updatePayload.sent_at = new Date().toISOString();
            if (pdfUrl) updatePayload.pdf_url = pdfUrl;
        }

        const { error } = await supabase
            .from("budgets")
            .update(updatePayload)
            .eq("id", budgetId);

        if (error) {
            console.error("Error updating budget status:", error);
            return { success: false, message: error.message };
        }

        const actionName = newStatus === "sent" ? "budget_sent" : newStatus === "closed" ? "budget_closed" : "budget_updated";
        const desc = newStatus === "sent" ? "Presupuesto finalizado y enviado." : newStatus === "closed" ? "Presupuesto cerrado." : `Estado cambiado a ${newStatus}.`;
        await insertAuditLog(supabase, budgetId, userData.user.id, actionName, desc);

        revalidatePath(`/budgets/${budgetId}`);
        revalidatePath("/dashboard");

        return { success: true, message: `Presupuesto marcado como ${newStatus === 'sent' ? 'enviado' : newStatus}.` };

    } catch (error: any) {
        return { success: false, message: error.message || "Error interno." };
    }
}

/**
 * Creates a new revision of an existing budget.
 * Clones the entire budget tree (partitions, lines, expenses) and sets the new status to 'draft'.
 */
export async function createRevision(originalBudgetId: string): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        // Check auth
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return { success: false, message: "No autorizado." };

        // 1. Fetch original budget
        const { data: oldBudget, error: fetchErr } = await supabase
            .from("budgets")
            .select("*")
            .eq("id", originalBudgetId)
            .single();

        if (fetchErr || !oldBudget) return { success: false, message: "Presupuesto original no encontrado." };

        // 2. Fetch all related entities
        const { data: partitions } = await supabase.from("budget_partitions").select("*").eq("budget_id", originalBudgetId);
        const { data: expenses } = await supabase.from("budget_general_expenses").select("*").eq("budget_id", originalBudgetId);
        const partIds = partitions?.map(p => p.id) || [];
        const { data: lines } = partIds.length > 0
            ? await supabase.from("budget_lines").select("*").in("partition_id", partIds)
            : { data: [] };

        // 3. Create new budget clone
        const newRevisionNumber = (oldBudget.revision || 0) + 1;

        // Remove ID and timestamps for clone
        const { id, created_at, updated_at, status, revision, ...budgetDataToClone } = oldBudget;

        const { data: newBudget, error: insertErr } = await supabase
            .from("budgets")
            .insert({
                ...budgetDataToClone,
                status: "draft",
                revision: newRevisionNumber,
                created_by: userData.user.id
            })
            .select("id")
            .single();

        if (insertErr) return { success: false, message: "Error al crear clon del presupuesto." };

        // 4. Clone Partitions mapping old IDs to new IDs
        const partitionIdMap: Record<string, string> = {};

        if (partitions && partitions.length > 0) {
            for (const part of partitions) {
                const { id: oldPId, created_at, updated_at, budget_id, is_awarded, ...partData } = part;
                const { data: newPart } = await supabase
                    .from("budget_partitions")
                    .insert({
                        ...partData,
                        budget_id: newBudget.id,
                        is_awarded: false // Revisions shouldn't carry over award status initially
                    })
                    .select("id")
                    .single();

                if (newPart) partitionIdMap[oldPId] = newPart.id;
            }
        }

        // 5. Clone Lines using the mapped partition IDs
        if (lines && lines.length > 0) {
            const linesToInsert = lines.map(line => {
                const { id: oldLId, created_at, updated_at, partition_id, ...lineData } = line;
                return {
                    ...lineData,
                    partition_id: partitionIdMap[partition_id]
                };
            }).filter(l => l.partition_id); // Ensure we mapped it

            if (linesToInsert.length > 0) {
                await supabase.from("budget_lines").insert(linesToInsert);
            }
        }

        // 6. Clone Expenses
        if (expenses && expenses.length > 0) {
            const expensesToInsert = expenses.map(exp => {
                const { id: oldEId, created_at, updated_at, budget_id, ...expData } = exp;
                return {
                    ...expData,
                    budget_id: newBudget.id
                };
            });
            await supabase.from("budget_general_expenses").insert(expensesToInsert);
        }

        await insertAuditLog(supabase, newBudget.id, userData.user.id, "budget_created", `Nueva revisión clonada a partir de ${oldBudget.code}.`);
        await insertAuditLog(supabase, originalBudgetId, userData.user.id, "budget_revision_created", `Se generó una nueva revisión: REV.${newRevisionNumber.toString().padStart(2, '0')}.`);

        revalidatePath("/dashboard");
        revalidatePath("/budgets");

        return {
            success: true,
            message: `Revisión REV.${newRevisionNumber.toString().padStart(2, '0')} creada exitosamente.`,
            data: { id: newBudget.id }
        };

    } catch (error: any) {
        console.error("Revision fallback error:", error);
        return { success: false, message: error.message || "Error interno al crear revisión." };
    }
}

/**
 * Closes an awarded budget definitively.
 */
export async function closeBudget(budgetId: string): Promise<ActionResponse> {
    return await updateBudgetStatus(budgetId, "closed");
}
