import { createSupabaseServerClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { BudgetEditorClient } from "@/components/editor/BudgetEditorClient";
import { BudgetState } from "@/contexts/BudgetEditorContext";
import { getCurrentUF } from "@/lib/actions/uf";

export const metadata = {
    title: "Editor de Presupuestos | VINISE",
};

export default async function BudgetEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    // 1. Fetch the main budget
    const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .select(`
            *,
            client:clients(company_name)
        `)
        .eq("id", id)
        .single();

    if (budgetError || !budget) {
        notFound();
    }

    // 2. Fetch partitions with their lines
    const { data: partitionsData } = await supabase
        .from("budget_partitions")
        .select(`
            id,
            number,
            name,
            sort_order,
            lines:budget_lines (
                id,
                item_id,
                custom_description,
                quantity,
                unit,
                material_value_clp,
                hh_value_clp,
                line_margin,
                sort_order
            )
        `)
        .eq("budget_id", id)
        .order("sort_order", { ascending: true });

    // Ensure lines are sorted
    const formattedPartitions = (partitionsData || []).map(p => ({
        ...p,
        lines: (p.lines || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
    }));

    // 3. Fetch general expenses
    const { data: expensesData } = await supabase
        .from("budget_general_expenses")
        .select("*")
        .eq("budget_id", id)
        .order("sort_order", { ascending: true });

    const currentUf = await getCurrentUF();

    // Construct the initial BudgetState
    const initialState: BudgetState = {
        project_name: budget.project_name || "",
        project_location: budget.project_location || "",
        client_id: budget.client_id,
        global_margin: budget.global_margin || 0.20,
        considerations: budget.considerations || "",
        proposal_duration: budget.proposal_duration || "30 días",
        partitions: formattedPartitions as any,
        general_expenses: expensesData as any || [],
        hasUnsavedChanges: false,
        status: budget.status || "draft",
    };

    // 4. Fetch all Items for the Command Palette (Catalog)
    const { data: itemsData } = await supabase
        .from("items")
        .select(`
            id,
            code,
            description,
            material_value_clp,
            hh_value_clp,
            margin:default_margin,
            unit,
            type:partition_type,
            company:companies(name)
        `)
        .eq("is_active", true);

    const catalogItems = itemsData || [];

    return (
        <div className="flex bg-slate-100 dark:bg-slate-950 min-h-[calc(100vh-64px)] w-full">
            <BudgetEditorClient
                budgetId={budget.id}
                initialData={initialState}
                catalogItems={catalogItems as any}
                currentUf={currentUf}
                clientName={budget.client?.company_name || ""}
            />
        </div>
    );
}
