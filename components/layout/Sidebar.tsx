"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
    { name: "Resumen", href: "/", icon: "home" },
    { name: "Presupuestos", href: "/dashboard", icon: "description" },
    { name: "Catálogo Items", href: "/database/items", icon: "inventory_2" },
    { name: "Clientes", href: "/clients", icon: "group" },
    { name: "Ajustes", href: "/settings", icon: "settings" },
];

export function Sidebar({ user }: { user?: any }) {
    const pathname = usePathname();

    const initials = user?.full_name
        ? user.full_name.substring(0, 2).toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || "US";

    return (
        <aside className="w-[250px] border-r border-slate-200 dark:border-slate-800 flex flex-col fixed inset-y-0 bg-white dark:bg-slate-900/50 z-20">
            <div className="p-6 flex items-center gap-3">
                <img src="/assets/logo-vinise.svg" alt="VINISE Logo" className="w-10 h-10 rounded-lg p-1 object-contain bg-white shadow-md shadow-blue-500/10" />
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">VINISE</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Budget System</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
                {navItems.filter(item => {
                    // Hide Database and Settings if user is an editor
                    if (user?.role === 'editor' && (item.href === '/database/items' || item.href === '/settings')) {
                        return false;
                    }
                    return true;
                }).map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                isActive
                                    ? "bg-blue-500/10 text-blue-500"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className={clsx("text-sm", isActive ? "font-semibold" : "font-medium")}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                    <div className="size-9 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-500 flex items-center justify-center font-bold text-xs uppercase border border-blue-500/20">
                        {initials}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                            {user?.full_name || "Usuario Activo"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                            {user?.role || "Sin Rol"}
                        </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all">logout</span>
                </div>
            </div>
        </aside>
    );
}
