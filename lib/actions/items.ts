"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { itemSchema, ItemFormValues } from "../validations/schemas";
import { revalidatePath } from "next/cache";

type ActionResponse = {
    success: boolean;
    message: string;
    errors?: any;
};

export async function createItem(data: ItemFormValues): Promise<ActionResponse> {
    try {
        const validatedData = itemSchema.parse(data);
        const supabase = await createSupabaseServerClient();

        // Check if item code already exists for the same company
        const { data: existing } = await supabase
            .from("items")
            .select("id")
            .eq("code", validatedData.code)
            .eq("company_id", validatedData.company_id)
            .single();

        if (existing) {
            return { success: false, message: "El código de ítem ya existe para esta empresa." };
        }

        const { error } = await supabase.from("items").insert(validatedData);

        if (error) {
            console.error("Supabase error:", error);
            return { success: false, message: error.message };
        }

        revalidatePath("/database/items");
        return { success: true, message: "Ítem creado exitosamente." };
    } catch (error: any) {
        if (error.name === "ZodError") {
            return { success: false, message: "Error de validación.", errors: error.errors };
        }
        return { success: false, message: error.message || "Error interno del servidor." };
    }
}

export async function updateItem(id: string, data: ItemFormValues): Promise<ActionResponse> {
    try {
        const validatedData = itemSchema.parse(data);
        const supabase = await createSupabaseServerClient();

        const { error } = await supabase
            .from("items")
            .update(validatedData)
            .eq("id", id);

        if (error) {
            return { success: false, message: error.message };
        }

        revalidatePath("/database/items");
        return { success: true, message: "Ítem actualizado exitosamente." };
    } catch (error: any) {
        if (error.name === "ZodError") {
            return { success: false, message: "Error de validación.", errors: error.errors };
        }
        return { success: false, message: error.message || "Error interno del servidor." };
    }
}

export async function toggleItemActive(id: string, currentStatus: boolean): Promise<ActionResponse> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("items")
        .update({ is_active: !currentStatus })
        .eq("id", id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath("/database/items");
    return { success: true, message: `Ítem ${!currentStatus ? 'activado' : 'desactivado'}.` };
}
