"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { clientSchema, ClientFormValues } from "@/lib/validations/schemas";
import { createClient, updateClient } from "@/lib/actions/clients";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { useEffect } from "react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

export function ClientFormDialog({ isOpen, onClose, initialData }: Props) {
    const [isPending, setIsPending] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema) as any,
        defaultValues: {
            company_name: initialData?.company_name || "",
            contact_name: initialData?.contact_name || "",
            city: initialData?.city || "",
            phone: initialData?.phone || "",
            email: initialData?.email || "",
            is_active: initialData?.is_active ?? true,
        },
    });

    if (!isOpen) return null;

    async function onSubmit(data: ClientFormValues) {
        setIsPending(true);
        try {
            let res;
            if (initialData?.id) {
                res = await updateClient(initialData.id, data);
            } else {
                res = await createClient(data);
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

    return mounted ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">
                            {initialData ? "edit" : "corporate_fare"}
                        </span>
                        {initialData ? "Editar Cliente" : "Nuevo Cliente"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Razón Social / Empresa <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...form.register("company_name")}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                placeholder="Ej: Constructora ABC SpA"
                            />
                            {form.formState.errors.company_name && (
                                <p className="text-red-500 text-xs">{form.formState.errors.company_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Persona de Contacto
                            </label>
                            <input
                                {...form.register("contact_name")}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Ciudad / Ubicación
                                </label>
                                <input
                                    {...form.register("city")}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                    placeholder="Ej: Antofagasta"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Teléfono
                                </label>
                                <input
                                    {...form.register("phone")}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                    placeholder="+56 9 1234 5678"
                                />
                                {form.formState.errors.phone && (
                                    <p className="text-red-500 text-xs">{form.formState.errors.phone.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                {...form.register("email")}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
                                placeholder="contacto@empresa.cl"
                            />
                            {form.formState.errors.email && (
                                <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" {...form.register("is_active")} />
                                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </div>
                                <span className={`text-sm font-bold transition-colors ${form.watch("is_active") ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                                    {form.watch("is_active") ? "Cliente Activo" : "Cliente Inactivo"}
                                </span>
                            </label>
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
                        form="client-form"
                        disabled={isPending}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isPending ? (
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined">save</span>
                        )}
                        {initialData ? "Guardar Cambios" : "Crear Cliente"}
                    </button>
                </div>
            </div>
        </div>, document.body
    ) : null;
}
