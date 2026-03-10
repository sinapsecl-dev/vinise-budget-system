import { createSupabaseServerClient } from "@/utils/supabase/server";

export const metadata = {
    title: "Configuración | VINISE",
};

export default async function SettingsPage() {
    const supabase = await createSupabaseServerClient();
    const { data: users } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });

    const activeUsersCount = users?.filter((u) => u.is_active).length || 0;
    const totalUsersCount = users?.length || 0;

    return (
        <div className="flex-1 flex flex-col overflow-hidden w-full">
            {/* Sub Top Bar */}
            <div className="border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 bg-white dark:bg-slate-900/50 flex overflow-x-auto hide-scrollbar">
                <nav className="flex gap-1">
                    <button className="px-4 py-4 text-sm font-semibold border-b-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500 whitespace-nowrap">Usuarios</button>
                    <button className="px-4 py-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-b-2 border-transparent transition-colors whitespace-nowrap">General</button>
                    <button className="px-4 py-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-b-2 border-transparent transition-colors whitespace-nowrap">Alertas</button>
                </nav>
            </div>

            {/* Dashboard Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col xl:flex-row gap-8">
                {/* Main Settings Section */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Gestión de Usuarios del Sistema</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Administra los accesos y permisos de tu equipo.</p>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 w-full sm:w-auto">
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            <span>Invitar Usuario</span>
                        </button>
                    </div>

                    {/* Users Table */}
                    <div className="glass-panel overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-6 py-4">Nombre</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Rol</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4">Último Acceso</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {users?.map((user) => {
                                        const initials = (user.full_name || user.email)
                                            .substring(0, 2)
                                            .toUpperCase();

                                        let roleColorClass = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
                                        if (user.role === "admin") {
                                            roleColorClass = "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20";
                                        } else if (user.role === "editor") {
                                            roleColorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20";
                                        }

                                        return (
                                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors bg-white dark:bg-transparent">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className={`size-8 rounded-full ${user.role === 'admin' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'} flex items-center justify-center font-bold text-xs`}>
                                                        {initials}
                                                    </div>
                                                    <span className="font-medium text-slate-900 dark:text-white">{user.full_name || "Sin Nombre"}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{user.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 ${roleColorClass} rounded text-[11px] font-bold uppercase tracking-tight border`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.is_active ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="size-2 rounded-full bg-emerald-500"></span>
                                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Activo</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="size-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-500">Inactivo</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm font-medium">
                                                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString("es-CL") : "Nunca"}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors px-2 py-1 rounded">
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {(!users || users.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                No se encontraron usuarios o la tabla está vacía.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Side Cards */}
                <aside className="w-full xl:w-80 flex flex-col gap-4">
                    <div className="glass-panel p-5">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Indicador Financiero</span>
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-500">trending_up</span>
                        </div>
                        <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Valor UF actual</h4>
                        <p className="text-2xl font-bold mt-1 tracking-tight text-blue-600 dark:text-blue-400">$38.426,21</p>
                    </div>

                    <div className="glass-panel p-5">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Capacidad Equipo</span>
                            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-500">group</span>
                        </div>
                        <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Usuarios activos</h4>
                        <div className="flex items-end gap-2 mt-1">
                            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{activeUsersCount}/{totalUsersCount}</p>
                            <span className="text-xs text-slate-500 font-medium mb-1">Licencias usadas</span>
                        </div>
                    </div>

                    <div className="glass-panel p-5">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Resumen Global</span>
                            <span className="material-symbols-outlined text-amber-600 dark:text-amber-500">assignment</span>
                        </div>
                        <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Presupuestos totales</h4>
                        <p className="text-2xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">--</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
