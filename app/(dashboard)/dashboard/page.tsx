import { createSupabaseServerClient } from "@/utils/supabase/server";
import { CreateBudgetDialog } from "@/components/editor/CreateBudgetDialog";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";

export const metadata = {
    title: "Dashboard | VINISE",
};

export default async function DashboardPage(props: {
    searchParams: Promise<{ q?: string; status?: string }>
}) {
    const searchParams = await props.searchParams;
    const supabase = await createSupabaseServerClient();
    const query = searchParams.q || "";
    const statusFilter = searchParams.status || "";

    // Fetch budgets
    let budgetsQuery = supabase
        .from("budgets")
        .select(`
            *,
            client:clients!inner(company_name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

    if (query) {
        // Note: Supabase PostgREST does not support OR conditions across foreign tables directly inline without a view.
        // We filter by project name and budget code here efficiently.
        budgetsQuery = budgetsQuery.or(`project_name.ilike.%${query}%,code.ilike.%${query}%`);
    }

    if (statusFilter) {
        budgetsQuery = budgetsQuery.eq("status", statusFilter);
    }

    const { data: budgets, error } = await budgetsQuery;
    if (error) {
        console.error("Dashboard budgets query error:", error);
    }

    // Fetch active clients for new budget modal
    const { data: clients } = await supabase
        .from("clients")
        .select("id, company_name")
        .eq("is_active", true)
        .order("company_name", { ascending: true });

    // Calculate generic stats
    const activeBudgets = budgets?.filter(b => b.status === "draft" || b.status === "sent" || b.status === "revision") || [];
    const sentThisMonth = budgets?.filter(b => b.status === "sent") || [];
    const awarded = budgets?.filter(b => b.status === "awarded" || b.status === "awarded_partial") || [];

    const totalUf = budgets?.reduce((acc, curr) => acc + ((curr as any).total_uf_final || 0), 0) || 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "draft": return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
            case "sent": return "bg-blue-500/10 text-blue-600 dark:text-blue-500";
            case "revision": return "bg-orange-500/10 text-orange-600 dark:text-orange-500";
            case "awarded": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500";
            case "awarded_partial": return "bg-teal-500/10 text-teal-600 dark:text-teal-500";
            case "rejected": return "bg-red-500/10 text-red-600 dark:text-red-500";
            case "closed": return "bg-slate-800/10 text-slate-700 dark:text-slate-300";
            default: return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "draft": return "Borrador";
            case "sent": return "Enviado";
            case "revision": return "En Revisión";
            case "awarded": return "Adjudicado";
            case "awarded_partial": return "Adj. Parcial";
            case "rejected": return "Rechazado";
            case "closed": return "Cerrado";
            default: return "Borrador";
        }
    };

    const getStatusDotColor = (status: string) => {
        switch (status) {
            case "draft": return "bg-slate-500";
            case "sent": return "bg-blue-500";
            case "revision": return "bg-orange-500";
            case "awarded": return "bg-emerald-500";
            case "awarded_partial": return "bg-teal-500";
            case "rejected": return "bg-red-500";
            case "closed": return "bg-slate-700";
            default: return "bg-slate-500";
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <span className="material-symbols-outlined">pending_actions</span>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded">Total</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Presupuestos Activos</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{activeBudgets.length}</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <span className="material-symbols-outlined">outgoing_mail</span>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded">Total</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Enviados</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{sentThisMonth.length}</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <span className="material-symbols-outlined">verified</span>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded">Total</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Adjudicados</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{awarded.length}</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded">Total</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Valor Estimado</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{totalUf.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF</h3>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Presupuestos Recientes</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona y monitorea los últimos presupuestos generados.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <DashboardSearch initialQuery={query} />
                        <DashboardFilter currentStatus={statusFilter} />
                        <CreateBudgetDialog clients={clients || []} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                                <th className="px-6 py-4">Código</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4 min-w-[200px]">Proyecto</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Total UF</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {budgets?.map((budget) => {
                                const companyName = budget.client && typeof budget.client === 'object' && 'company_name' in budget.client
                                    ? (budget.client as { company_name: string }).company_name
                                    : 'Desconocido';

                                return (
                                    <tr key={budget.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-medium text-slate-500 dark:text-slate-400">{budget.code}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{companyName}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-[250px]" title={budget.project_name || "Sin Proyecto"}>{budget.project_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusColor(budget.status)}`}>
                                                <span className={`size-1.5 rounded-full ${getStatusDotColor(budget.status)}`}></span>
                                                {getStatusText(budget.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-right">
                                            {(budget as any).total_uf_final
                                                ? (budget as any).total_uf_final.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                : "0,00"} UF
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                                            {new Date(budget.created_at).toLocaleDateString("es-CL", { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <a href={`/budgets/${budget.id}`} className="inline-flex items-center justify-center p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Ver / Editar Presupuesto">
                                                <span className="material-symbols-outlined text-[20px]">edit_document</span>
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}

                            {(!budgets || budgets.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No se encontraron presupuestos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between bg-white/50 dark:bg-slate-800/50 rounded-b-2xl">
                    <p className="text-xs text-slate-500">Mostrando {budgets?.length || 0} presupuestos</p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50" disabled>
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button className="p-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50" disabled>
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
