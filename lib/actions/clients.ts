"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { clientSchema, ClientFormValues } from "../validations/schemas";
import { revalidatePath } from "next/cache";

type ActionResponse = {
    success: boolean;
    message: string;
    errors?: any;
};

export async function createClient(data: ClientFormValues): Promise<ActionResponse> {
    try {
        const validatedData = clientSchema.parse(data);
        const supabase = await createSupabaseServerClient();

        const { error } = await supabase.from("clients").insert(validatedData);

        if (error) {
            console.error("Supabase error:", error);
            return { success: false, message: error.message };
        }

        revalidatePath("/clients");
        return { success: true, message: "Cliente creado exitosamente." };
    } catch (error: any) {
        if (error.name === "ZodError") {
            return { success: false, message: "Error de validación.", errors: error.errors };
        }
        return { success: false, message: error.message || "Error interno." };
    }
}

export async function updateClient(id: string, data: ClientFormValues): Promise<ActionResponse> {
    try {
        const validatedData = clientSchema.parse(data);
        const supabase = await createSupabaseServerClient();

        const { error } = await supabase
            .from("clients")
            .update(validatedData)
            .eq("id", id);

        if (error) {
            return { success: false, message: error.message };
        }

        revalidatePath("/clients");
        return { success: true, message: "Cliente actualizado exitosamente." };
    } catch (error: any) {
        if (error.name === "ZodError") {
            return { success: false, message: "Error de validación.", errors: error.errors };
        }
        return { success: false, message: error.message || "Error interno." };
    }
}
