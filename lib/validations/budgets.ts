import * as z from "zod";

export const createBudgetSchema = z.object({
    client_id: z.string().uuid("Seleccione un cliente válido."),
    project_name: z.string().min(3, "El nombre del proyecto es muy corto.").max(255),
    project_location: z.string().max(255).optional().nullable(),
    global_margin: z.number().min(0).max(1),
    considerations: z.string().optional().nullable(),
    proposal_duration: z.string(),
});

export type CreateBudgetFormValues = z.infer<typeof createBudgetSchema>;

// Schema for a single line item
export const budgetLineSchema = z.object({
    id: z.string().uuid().optional(), // Optional for new lines before saving
    item_id: z.string().uuid("Debe seleccionar un ítem del catálogo").optional().nullable(),
    custom_description: z.string().min(1, "La descripción no puede estar vacía"),
    quantity: z.number().min(0, "La cantidad debe ser 0 o mayor"),
    unit: z.string(),
    material_value_clp: z.number().min(0),
    hh_value_clp: z.number().min(0),
    line_margin: z.number().min(0).max(1).optional().nullable(),
    sort_order: z.number().int().default(0),
});

export type BudgetLineValues = z.infer<typeof budgetLineSchema>;

// Schema for a partition
export const budgetPartitionSchema = z.object({
    id: z.string().uuid().optional(), // Optional for new partitions before saving
    number: z.number().int().positive(),
    name: z.string().min(1, "El nombre de la partida es obligatorio"),
    sort_order: z.number().int().default(0),
    is_awarded: z.boolean().default(false).optional(),
    lines: z.array(budgetLineSchema).default([]),
});

export type BudgetPartitionValues = z.infer<typeof budgetPartitionSchema>;

// Schema for general expenses
export const budgetGeneralExpenseSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "El nombre del gasto es obligatorio"),
    value_clp: z.number().min(0, "El valor debe ser positivo"),
    quantity: z.number().min(1).default(1),
    allocation: z.string().default("A"), // 'A' for all, or UUID for specific partition
    sort_order: z.number().int().default(0),
});

export type BudgetGeneralExpenseValues = z.infer<typeof budgetGeneralExpenseSchema>;

// Full budget save schema
export const saveBudgetSchema = z.object({
    project_name: z.string().min(1).max(255),
    project_location: z.string().optional().nullable(),
    client_id: z.string().uuid().optional().nullable(),
    global_margin: z.number().min(0).max(1),
    considerations: z.string().optional().nullable(),
    proposal_duration: z.string().optional().nullable(),
    total_uf_final: z.number().optional().nullable(),
    partitions: z.array(budgetPartitionSchema).default([]),
    general_expenses: z.array(budgetGeneralExpenseSchema).default([]),
});

export type SaveBudgetValues = z.infer<typeof saveBudgetSchema>;
