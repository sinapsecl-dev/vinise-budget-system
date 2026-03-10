"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function DashboardSearch({ initialQuery = "" }: { initialQuery?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(initialQuery);

    // Simple debounce logic
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (searchTerm) {
                params.set("q", searchTerm);
            } else {
                params.delete("q");
            }
            // avoid unnecessary pushes
            if (searchParams.get("q") !== searchTerm && (searchParams.get("q") || searchTerm)) {
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm, pathname, router, searchParams]);

    return (
        <div className="relative group flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">search</span>
            <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full md:w-64 transition-all"
                placeholder="Buscar proyecto o código..."
                type="text"
            />
        </div>
    );
}
