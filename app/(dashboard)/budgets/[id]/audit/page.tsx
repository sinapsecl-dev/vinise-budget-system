import Link from "next/link";
import React from "react";
import { createSupabaseServerClient } from "@/utils/supabase/server";

function getActionColor(action: string) {
    if (action.includes("create") || action === "budget_created") return "blue";
    if (action.includes("update") || action === "budget_updated") return "amber";
    if (action.includes("delete")) return "red";
    if (action.includes("sent") || action === "budget_sent") return "emerald";
    if (action.includes("award") || action === "budget_awarded") return "indigo";
    if (action.includes("close") || action === "budget_closed") return "slate";
    return "slate";
}

function getActionIcon(action: string) {
    if (action.includes("create")) return "add_circle";
    if (action.includes("update")) return "edit";
    if (action.includes("delete")) return "delete";
    if (action.includes("sent")) return "send";
    if (action.includes("award")) return "workspace_premium";
    if (action.includes("close")) return "lock";
    return "history";
}

export default async function BudgetAuditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // Fetch logs
    const { data: logs, error } = await supabase
        .from("audit_log")
        .select(`
            *,
            users:user_id(full_name)
        `)
        .eq("budget_id", id)
        .order("created_at", { ascending: false });

    return (
        <div className="flex-1 p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/budgets/${id}`} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Registro de Actividad</h1>
                        <p className="text-sm text-slate-500">Historial completo de modificaciones del presupuesto</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                    <div className="absolute left-[39px] top-8 bottom-8 w-px bg-slate-200 dark:bg-slate-800"></div>

                    <div className="space-y-8 relative">
                        {(!logs || logs.length === 0) ? (
                            <p className="text-slate-500 pl-16">No hay registros de auditoría disponibles.</p>
                        ) : (
                            logs.map((log: any) => {
                                const color = getActionColor(log.action);
                                const icon = getActionIcon(log.action);
                                const dateStr = new Date(log.created_at).toLocaleString('es-CL', {
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                });

                                const userName = log.users?.full_name || "Sistema";

                                return (
                                    <div key={log.id} className="flex gap-6 group">
                                        <div className={`w-6 h-6 rounded-full bg-${color}-100 dark:bg-${color}-900/30 border-2 border-white dark:border-slate-950 flex items-center justify-center shrink-0 z-10 shadow-sm transition-transform group-hover:scale-110`}>
                                            <span className={`w-2 h-2 rounded-full bg-${color}-600 dark:bg-${color}-500`}></span>
                                        </div>
                                        <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{log.action.replace(/_/g, " ")}</p>
                                                    <p className="text-xs text-slate-500">Por <span className="font-medium text-slate-700 dark:text-slate-400">{userName}</span></p>
                                                </div>
                                                <span className="text-xs font-mono text-slate-400 bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">{dateStr}</span>
                                            </div>
                                            {log.field_changed && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                                    Cambio en <span className="font-medium">{log.field_changed}</span> de <span className="line-through opacity-70">{log.old_value || "vacío"}</span> a <span className="font-bold">{log.new_value || "vacío"}</span>.
                                                </p>
                                            )}
                                            {log.metadata && log.metadata.description && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                                    {log.metadata.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
