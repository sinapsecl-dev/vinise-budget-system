"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface CatalogItem {
    id: string;
    code: string;
    description: string;
    material_value_clp: number;
    hh_value_clp: number;
    margin: number;
    unit: string;
    type?: string;
    company?: { name: string };
}

interface ItemSearchCommandPaletteProps {
    items: CatalogItem[];
    onClose: () => void;
    onSelect: (item: CatalogItem) => void;
}

export function ItemSearchCommandPalette({ items, onClose, onSelect }: ItemSearchCommandPaletteProps) {
    const [search, setSearch] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredItems = useMemo(() => {
        if (!search) return items.slice(0, 50); // Show top 50 initially
        const lowerSearch = search.toLowerCase();
        return items.filter(item => {
            let companyName = "";
            if (item.company && !Array.isArray(item.company)) {
                companyName = item.company.name || "";
            } else if (item.company && Array.isArray(item.company) && item.company.length > 0) {
                // PostgREST sometimes returns an array for foreign tables depending on the relationship
                companyName = item.company[0].name || "";
            }

            return item.code.toLowerCase().includes(lowerSearch) ||
                item.description.toLowerCase().includes(lowerSearch) ||
                companyName.toLowerCase().includes(lowerSearch);
        }).slice(0, 50);
    }, [items, search]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && filteredItems.length > 0) {
                e.preventDefault();
                onSelect(filteredItems[selectedIndex]);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [filteredItems, selectedIndex, onClose, onSelect]);

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    // Auto-scroll logic could go here

    return mounted ? createPortal(
        <>
            {/* Backdrop Overlay */}
            <div
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 transition-opacity"
                onClick={onClose}
            />

            {/* Command Palette Container */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
                <div className="w-full max-w-[700px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800/80 ring-1 ring-black/5 dark:ring-white/10 relative">

                    {/* Decorative Glow inside */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 blur-[80px] rounded-full -z-10 pointer-events-none"></div>

                    {/* Search Header */}
                    <div className="flex items-center px-4 py-4 border-b border-slate-200 dark:border-slate-700/50">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-500 mr-3 text-2xl">search</span>
                        <input
                            ref={inputRef}
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none outline-none focus:ring-0 w-full text-lg placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 font-light"
                            placeholder="Buscar ítems por código o descripción..."
                            type="text"
                        />
                        <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider ml-2">
                            ESC para cerrar
                        </div>
                    </div>

                    {/* Results List */}
                    <div ref={listRef} className="max-h-[420px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-blue-500/30 [&::-webkit-scrollbar-thumb]:rounded-full">

                        {filteredItems.length === 0 ? (
                            <div className="px-6 py-12 text-center text-slate-500">
                                No se encontraron ítems coincidiendo con "{search}"
                            </div>
                        ) : (
                            filteredItems.map((item, index) => {
                                const isActive = index === selectedIndex;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => onSelect(item)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`group flex items-start gap-4 p-4 cursor-pointer transition-colors relative border-l-2
                                            ${isActive
                                                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-600 dark:border-blue-500"
                                                : "border-transparent hover:bg-blue-50/50 dark:hover:bg-blue-500/5 hover:border-blue-300 dark:hover:border-transparent"}
                                        `}
                                    >
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                                            ${isActive
                                                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600"}
                                        `}>
                                            <span className="material-symbols-outlined">{item.type === 'Material' ? 'category' : (item.type === 'Servicio' ? 'build' : 'bolt')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-200 tracking-tight">{item.code}</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                                                    {item.company && !Array.isArray(item.company) ? item.company.name : (item.company && Array.isArray(item.company) && item.company.length > 0 ? item.company[0].name : "General")}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-100 font-medium truncate">{item.description}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <span>Mat: <span className="text-slate-700 dark:text-slate-300 font-medium">${(item.material_value_clp || 0).toLocaleString('es-CL')}</span></span>
                                                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
                                                <span>HH: <span className="text-slate-700 dark:text-slate-300 font-medium">${(item.hh_value_clp || 0).toLocaleString('es-CL')}</span></span>
                                                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
                                                <span className="hidden sm:inline font-mono text-[10px] uppercase bg-slate-100 dark:bg-slate-800 px-1 rounded">{item.unit || "CU"}</span>
                                                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
                                                <span>Mg: <span className="text-emerald-600 dark:text-emerald-500 font-semibold text-[11px] bg-emerald-500/10 px-1 rounded">{Math.round((item.margin || 0) * 100)}%</span></span>
                                            </div>
                                        </div>
                                        {isActive && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block">
                                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-500 text-xl">keyboard_return</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer Navigation Hints */}
                    <div className="hidden sm:flex px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700/50 items-center justify-between">
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <span className="flex items-center justify-center w-5 h-5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans shadow-sm text-slate-600 dark:text-slate-400">↑</span>
                                <span className="flex items-center justify-center w-5 h-5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans shadow-sm text-slate-600 dark:text-slate-400">↓</span>
                                <span className="ml-0.5">Navegar</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="flex items-center justify-center px-1.5 h-5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans shadow-sm text-slate-600 dark:text-slate-400">↵</span>
                                <span>Seleccionar</span>
                            </div>
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40 dark:bg-blue-500/60"></span>
                            {filteredItems.length} resultados
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    ) : null;
}
