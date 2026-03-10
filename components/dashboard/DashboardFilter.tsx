"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const STATUSES = [
    { value: "", label: "Todos los estados" },
    { value: "draft", label: "Borrador" },
    { value: "sent", label: "Enviado" },
    { value: "revision", label: "En Revisión" },
    { value: "awarded", label: "Adjudicado" },
    { value: "awarded_partial", label: "Adj. Parcial" },
    { value: "rejected", label: "Rechazado" },
    { value: "closed", label: "Cerrado" },
];

export function DashboardFilter({ currentStatus = "" }: { currentStatus?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set("status", value);
        } else {
            params.delete("status");
        }
        router.push(`${pathname}?${params.toString()}`);
        setIsOpen(false);
    };

    const currentValueLabel = STATUSES.find(s => s.value === currentStatus)?.label || "Filtro";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${currentStatus
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                        : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                title="Filtrar por estado"
            >
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                <span className="text-sm font-medium hidden md:block">{currentValueLabel}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50">
                    {STATUSES.map((status) => (
                        <button
                            key={status.value}
                            onClick={() => handleSelect(status.value)}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentStatus === status.value
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
