import * as z from "zod";

const PARTITION_TYPES = ["EMPALME", "OOEE", "OOCC", "RED_DISTRIBUCION", "INDUSTRIAL", "OTRO"] as const;
const UNIT_TYPES = ["CU", "M", "ML", "M2", "M3", "GL", "KG", "UN", "HR"] as const;

export const itemSchema = z.object({
    code: z.string().min(1, "El código es obligatorio").max(50, "Máximo 50 caracteres"),
    company_id: z.string().uuid("Debe seleccionar una empresa válida"),
    partition_type: z.enum(PARTITION_TYPES, { error: "Seleccione un tipo de partida" }),
    description: z.string().min(3, "La descripción debe tener al menos 3 caracteres").max(255),
    unit: z.enum(UNIT_TYPES, { error: "La unidad es obligatoria" }),
    material_value_clp: z.number().int().min(0, "El valor debe ser positivo"),
    hh_value_clp: z.number().int().min(0, "El valor debe ser positivo"),
    default_margin: z.number().min(0, "El margen no puede ser negativo").max(1, "El margen máximo es 100% (1.0)"),
    is_active: z.boolean().default(true),
});

export type ItemFormValues = z.infer<typeof itemSchema>;

export const clientSchema = z.object({
    company_name: z.string().min(2, "El nombre de la empresa es obligatorio").max(100),
    contact_name: z.string().max(100).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    phone: z
        .string()
        .regex(/^\+56\s?9\s?\d{4}\s?\d{4}$/, "Debe ser un formato válido chileno ej: +56 9 1234 5678")
        .optional()
        .nullable()
        .or(z.literal(""))
        .transform(val => val === "" ? null : val),
    email: z.string().email("Debe ser un email válido").optional().nullable().or(z.literal("")).transform(val => val === "" ? null : val),
    is_active: z.boolean().default(true),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
