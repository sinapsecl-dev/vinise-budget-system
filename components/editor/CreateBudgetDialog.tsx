"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBudgetSchema, CreateBudgetFormValues } from "@/lib/validations/budgets";
import { createBudget } from "@/lib/actions/budgets";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect } from "react";

interface Props {
    clients: { id: string, company_name: string }[];
}

export function CreateBudgetDialog({ clients }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const form = useForm<CreateBudgetFormValues>({
        resolver: zodResolver(createBudgetSchema),
        defaultValues: {
            client_id: "",
            project_name: "",
            project_location: "",
            global_margin: 0.20,
            considerations: "",
            proposal_duration: "30 días corridos",
        },
    });

    async function onSubmit(data: CreateBudgetFormValues) {
        setIsPending(true);
        try {
            const res = await createBudget(data);
            if (res.success && res.data?.id) {
                toast.success(res.message);
                setIsOpen(false);
                form.reset();
                router.push(`/budgets/${res.data.id}`);
            } else {
                toast.error(res.message || "Error al crear presupuesto.");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20 w-full md:w-auto justify-center"
            >
                <span className="material-symbols-outlined text-[20px]">add_box</span>
                Nuevo Presupuesto
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-500">add_box</span>
                                Iniciar Nuevo Presupuesto
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="create-budget-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Cliente Asociado <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...form.register("client_id")}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200"
                                    >
                                        <option value="">Seleccione un cliente...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.company_name}</option>
                                        ))}
                                    </select>
                                    {form.formState.errors.client_id && (
                                        <p className="text-xs text-red-500">{form.formState.errors.client_id.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Nombre del Proyecto <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...form.register("project_name")}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200"
                                        placeholder="Ej: Ampliación Galpón 4"
                                    />
                                    {form.formState.errors.project_name && (
                                        <p className="text-xs text-red-500">{form.formState.errors.project_name.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Ubicación
                                        </label>
                                        <input
                                            {...form.register("project_location")}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200"
                                            placeholder="Ej: Antofagasta"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Margen Global Esperado
                                        </label>
                                        <div className="flex items-center gap-2 h-[42px]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const current = form.getValues("global_margin");
                                                    form.setValue("global_margin", Math.max(0, current - 0.01), { shouldValidate: true });
                                                }}
                                                className="w-10 h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">remove</span>
                                            </button>
                                            <div className="flex-1 h-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-sm font-bold text-slate-900 dark:text-slate-200">
                                                {Math.round(form.watch("global_margin") * 100)}%
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const current = form.getValues("global_margin");
                                                    form.setValue("global_margin", Math.min(1, current + 0.01), { shouldValidate: true });
                                                }}
                                                className="w-10 h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">add</span>
                                            </button>
                                        </div>
                                        {form.formState.errors.global_margin && (
                                            <p className="text-xs text-red-500">{form.formState.errors.global_margin.message}</p>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="create-budget-form"
                                disabled={isPending}
                                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isPending ? (
                                    <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                                )}
                                Iniciar Entorno
                            </button>
                        </div>
                    </div>
                </div>, document.body
            )}
        </>
    );
}
