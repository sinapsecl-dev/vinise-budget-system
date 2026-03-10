"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { itemSchema, ItemFormValues } from "@/lib/validations/schemas";
import { createItem, updateItem } from "@/lib/actions/items";
import { toast } from "sonner";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    companies: any[];
}

export function ItemFormDialog({ isOpen, onClose, initialData, companies }: Props) {
    const [isPending, setIsPending] = useState(false);

    const form = useForm<ItemFormValues>({
        resolver: zodResolver(itemSchema) as any,
        defaultValues: {
            code: "",
            company_id: "",
            partition_type: "OTRO",
            description: "",
            unit: "CU",
            material_value_clp: 0,
            hh_value_clp: 0,
            default_margin: 0.2,
            is_active: true,
        },
    });

    // Populate form data when editing or reset when opening/closing
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                form.reset({
                    code: initialData.code || "",
                    company_id: initialData.company_id || "",
                    partition_type: initialData.partition_type || "OTRO",
                    description: initialData.description || "",
                    unit: initialData.unit || "CU",
                    material_value_clp: initialData.material_value_clp || 0,
                    hh_value_clp: initialData.hh_value_clp || 0,
                    default_margin: initialData.default_margin ?? 0.20,
                    is_active: initialData.is_active ?? true,
                });
            } else {
                form.reset({
                    code: "",
                    company_id: "",
                    partition_type: "OTRO",
                    description: "",
                    unit: "CU",
                    material_value_clp: 0,
                    hh_value_clp: 0,
                    default_margin: 0.2,
                    is_active: true,
                });
            }
        }
    }, [isOpen, initialData, form]);

    if (!isOpen) return null;

    async function onSubmit(data: ItemFormValues) {
        setIsPending(true);
        try {
            let res;
            if (initialData?.id) {
                res = await updateItem(initialData.id, data);
            } else {
                res = await createItem(data);
            }

            if (res.success) {
                toast.success(res.message);
                form.reset();
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">
                            {initialData ? "edit" : "add_circle"}
                        </span>
                        {initialData ? "Editar Ítem" : "Nuevo Ítem"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="item-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Código <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...form.register("code")}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                    placeholder="Ej: ITEM-001"
                                />
                                {form.formState.errors.code && (
                                    <p className="text-red-500 text-xs">{form.formState.errors.code.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Compañía <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...form.register("company_id")}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                >
                                    <option value="">Seleccione una empresa</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {form.formState.errors.company_id && (
                                    <p className="text-red-500 text-xs">{form.formState.errors.company_id.message}</p>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Descripción <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    {...form.register("description")}
                                    rows={3}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                    placeholder="Descripción detallada del ítem..."
                                />
                                {form.formState.errors.description && (
                                    <p className="text-red-500 text-xs">{form.formState.errors.description.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Tipo de Partida <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...form.register("partition_type")}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                >
                                    <option value="EMPALME">Empalme</option>
                                    <option value="OOEE">Obras Eléctricas (OOEE)</option>
                                    <option value="OOCC">Obras Civiles (OOCC)</option>
                                    <option value="RED_DISTRIBUCION">Red de Distribución</option>
                                    <option value="INDUSTRIAL">Industrial</option>
                                    <option value="OTRO">Otro</option>
                                </select>
                                {form.formState.errors.partition_type && (
                                    <p className="text-red-500 text-xs">{form.formState.errors.partition_type.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Unidad <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...form.register("unit")}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                >
                                    <option value="CU">CU</option>
                                    <option value="M">M</option>
                                    <option value="ML">ML</option>
                                    <option value="M2">M2</option>
                                    <option value="GL">GL</option>
                                    <option value="KG">KG</option>
                                    <option value="UN">UN</option>
                                    <option value="HR">HR</option>
                                </select>
                                {form.formState.errors.unit && (
                                    <p className="text-red-500 text-xs">{form.formState.errors.unit.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Valor Material (CLP) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    {...form.register("material_value_clp", { valueAsNumber: true })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                />
                                {form.formState.errors.material_value_clp && (
                                    <p className="text-red-500 text-xs">{form.formState.errors.material_value_clp.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Valor HH (CLP) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    {...form.register("hh_value_clp", { valueAsNumber: true })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                />
                                {form.formState.errors.hh_value_clp && (
                                    <p className="text-red-500 text-xs">{form.formState.errors.hh_value_clp.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Margen Global Esperado <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 w-10 h-10 rounded-l-lg flex items-center justify-center transition-colors focus:outline-none"
                                        onClick={() => {
                                            const currentVal = form.getValues("default_margin") || 0;
                                            const newVal = Math.max(0, currentVal - 0.01);
                                            form.setValue("default_margin", Number(newVal.toFixed(2)), { shouldValidate: true });
                                        }}
                                        title="Reducir 1%"
                                    >
                                        <span className="material-symbols-outlined text-sm font-bold">remove</span>
                                    </button>
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            className="w-full bg-slate-50 dark:bg-slate-950 border-y border-x-0 border-slate-200 dark:border-slate-800 px-4 py-2 text-sm text-center focus:ring-2 focus:ring-blue-500 focus:z-10 text-slate-900 dark:text-slate-200 font-bold"
                                            value={`${Math.round((form.watch("default_margin") || 0) * 100)}%`}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value.replace('%', ''));
                                                if (!isNaN(val)) {
                                                    const decimalVal = Number((val / 100).toFixed(4));
                                                    form.setValue("default_margin", decimalVal, { shouldValidate: true });
                                                }
                                            }}
                                            onBlur={(e) => {
                                                // Ensure visual formatting is reapplied perfectly on blur by re-triggering watch
                                                const currentVal = form.getValues("default_margin") || 0;
                                                form.setValue("default_margin", currentVal);
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 w-10 h-10 rounded-r-lg flex items-center justify-center transition-colors focus:outline-none"
                                        onClick={() => {
                                            const currentVal = form.getValues("default_margin") || 0;
                                            const newVal = Math.min(1, currentVal + 0.01);
                                            form.setValue("default_margin", Number(newVal.toFixed(2)), { shouldValidate: true });
                                        }}
                                        title="Aumentar 1%"
                                    >
                                        <span className="material-symbols-outlined text-sm font-bold">add</span>
                                    </button>
                                </div>
                                <input type="hidden" {...form.register("default_margin", { valueAsNumber: true })} />
                                {form.formState.errors.default_margin && (
                                    <p className="text-red-500 text-xs">{form.formState.errors.default_margin.message}</p>
                                )}
                            </div>

                            <div className="space-y-2 pt-8">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" {...form.register("is_active")} />
                                        <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </div>
                                    <span className={`text-sm font-medium ${form.watch("is_active") ? "text-emerald-600 dark:text-emerald-500" : "text-slate-600 dark:text-slate-400"}`}>
                                        {form.watch("is_active") ? "Ítem Activo" : "Ítem Inactivo"}
                                    </span>
                                </label>
                            </div>

                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="item-form"
                        disabled={isPending}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isPending ? (
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined">save</span>
                        )}
                        {initialData ? "Guardar Cambios" : "Crear Ítem"}
                    </button>
                </div>
            </div>
        </div>
    );
}
