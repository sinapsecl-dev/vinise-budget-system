"use client";

import { usePathname } from "next/navigation";

export function Header({ user, currentUf = 38000 }: { user?: any, currentUf?: number }) {
    const pathname = usePathname();
    // Basic title mapping based on pathname
    let title = "Dashboard";
    if (pathname.includes("/budgets")) title = "Presupuestos";
    if (pathname.includes("/database")) title = "Base de Datos de Ítems";
    if (pathname.includes("/clients")) title = "Clientes";
    if (pathname.includes("/settings")) title = "Configuración";

    const initials = user?.full_name
        ? user.full_name.substring(0, 2).toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || "US";

    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>

            <div className="flex items-center gap-6">
                {/* UF Indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">
                        UF: ${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currentUf)}
                    </span>
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-slate-500 hover:text-blue-500 transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    {/* Add notification dot if there are any */}
                    {/* <span className="absolute top-2 right-2 size-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-[#0F172A]"></span> */}
                </button>

                {/* Right Logo / Avatar */}
                <div className="size-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-500 font-bold text-xs uppercase cursor-pointer hover:bg-blue-500/20 transition-colors">
                    {initials}
                </div>
            </div>
        </header>
    );
}
