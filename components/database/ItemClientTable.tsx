"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ItemFormDialog } from "./ItemFormDialog";
import { toggleItemActive } from "@/lib/actions/items";
import { toast } from "sonner";

interface Props {
    initialItems: any[];
    companies: any[];
}

const typeColors: Record<string, string> = {
    'EMPALME': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    'OOEE': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    'OOCC': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    'RED_DISTRIBUCION': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20',
    'INDUSTRIAL': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    'OTRO': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

export function ItemClientTable({ initialItems, companies }: Props) {
    const [search, setSearch] = useState("");
    const [filterCompany, setFilterCompany] = useState("");
    const [filterType, setFilterType] = useState("");
    const [showInactive, setShowInactive] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const now = new Date();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredItems = useMemo(() => {
        return initialItems.filter((item) => {
            const matchSearch = item.code.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase());
            const matchCompany = filterCompany ? item.company_id === filterCompany : true;
            const matchType = filterType ? item.partition_type === filterType : true;
            const matchActive = showInactive ? true : item.is_active;

            return matchSearch && matchCompany && matchType && matchActive;
        });
    }, [initialItems, search, filterCompany, filterType, showInactive]);

    const itemsRequiringReview = initialItems.filter((item) => {
        const lastRev = new Date(item.last_reviewed_at);
        const diffDays = Math.ceil(Math.abs(now.getTime() - lastRev.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 60;
    }).length;

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    async function handleToggleStatus(item: any) {
        toast.promise(toggleItemActive(item.id, item.is_active), {
            loading: "Cambiando estado...",
            success: (data) => data.message,
            error: "Error al cambiar estado"
        });
    }

    function handleEdit(item: any) {
        setEditingItem(item);
        setIsDialogOpen(true);
    }

    function handleCreate() {
        setEditingItem(null);
        setIsDialogOpen(true);
    }

    return (
        <div className="flex flex-col min-w-0 overflow-y-auto w-full">
            {/* Alert Banner */}
            {itemsRequiringReview > 0 && (
                <div className="px-4 sm:px-8 py-4 sm:py-6">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500">
                            <span className="material-symbols-outlined flex-shrink-0">warning</span>
                            <p className="text-sm font-medium">{itemsRequiringReview} ítems requieren revisión de precios (más de 60 días sin actualizar)</p>
                        </div>
                        <button className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 text-sm font-bold underline underline-offset-4 transition-colors whitespace-nowrap">
                            Ver ítems
                        </button>
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className={`px-4 sm:px-8 ${itemsRequiringReview > 0 ? 'pb-6 pt-2' : 'py-6'} flex flex-col md:flex-row items-center gap-4`}>
                <div className="flex-1 w-full min-w-[300px] relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                    <input
                        ref={searchInputRef}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 pl-10 pr-16 py-2.5 rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-500 transition-all font-medium text-sm"
                        placeholder="Buscar por código o descripción..."
                        type="text"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-50 pointer-events-none">
                        <kbd className="font-sans px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400">Ctrl</kbd>
                        <span className="text-xs text-slate-400 font-bold">+</span>
                        <kbd className="font-sans px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400">K</kbd>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <select
                        value={filterCompany}
                        onChange={(e) => { setFilterCompany(e.target.value); setCurrentPage(1); }}
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-sm text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todas las compañías</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-sm text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos los tipos</option>
                        <option value="EMPALME">Empalme</option>
                        <option value="OOEE">OOEE</option>
                        <option value="OOCC">OOCC</option>
                        <option value="RED_DISTRIBUCION">Red Distribución</option>
                        <option value="INDUSTRIAL">Industrial</option>
                        <option value="OTRO">Otro</option>
                    </select>

                    <label className="flex items-center gap-3 cursor-pointer group ml-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Mostrar inactivos</span>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => { setShowInactive(e.target.checked); setCurrentPage(1); }}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </div>
                    </label>
                </div>

                <button
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 w-full md:w-auto ml-auto md:ml-4"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Nuevo Ítem</span>
                </button>
            </div>

            {/* Table Section */}
            <div className="px-4 sm:px-8 pb-8 flex-1">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-700/80">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200/80 dark:border-slate-700/80">
                                    <th className="px-6 py-4">Código</th>
                                    <th className="px-6 py-4">Compañía</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4 min-w-[250px]">Descripción</th>
                                    <th className="px-4 py-4 text-center">Unidad</th>
                                    <th className="px-4 py-4 text-right">Mat. CLP</th>
                                    <th className="px-4 py-4 text-right">HH CLP</th>
                                    <th className="px-4 py-4 text-center">Margen</th>
                                    <th className="px-6 py-4">Última Rev.</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {paginatedItems.map((item) => {
                                    const lastRev = new Date(item.last_reviewed_at);
                                    const diffDays = Math.ceil(Math.abs(now.getTime() - lastRev.getTime()) / (1000 * 60 * 60 * 24));
                                    const requiresReview = diffDays > 60;
                                    const typeColorClass = typeColors[item.partition_type] || typeColors['OTRO'];

                                    const companyName = item.company && typeof item.company === 'object' && 'name' in item.company
                                        ? (item.company as { name: string }).name
                                        : companies.find(c => c.id === item.company_id)?.name || 'Desconocida';

                                    return (
                                        <tr key={item.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group ${!item.is_active ? 'opacity-60 bg-slate-50/80 dark:bg-slate-800/40' : 'bg-transparent'}`}>
                                            <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-600 dark:text-blue-500">
                                                {item.code}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                                {companyName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`${typeColorClass} text-[10px] px-2 py-0.5 rounded font-bold uppercase border`}>
                                                    {item.partition_type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-[250px] truncate" title={item.description}>
                                                {item.description}
                                            </td>
                                            <td className="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400 font-mono">
                                                {item.unit}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-slate-900 dark:text-slate-200">
                                                ${item.material_value_clp.toLocaleString('es-CL')}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-slate-900 dark:text-slate-200">
                                                ${item.hh_value_clp.toLocaleString('es-CL')}
                                            </td>
                                            <td className="px-4 py-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                {(item.default_margin * 100).toFixed(0)}%
                                            </td>
                                            <td className="px-6 py-4">
                                                {requiresReview ? (
                                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-xs font-bold">
                                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                                        {diffDays} días
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        Hace {diffDays} días
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-500 border border-slate-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                                        Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-600 dark:hover:text-white rounded transition-colors"
                                                        title="Editar Ítem"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(item)}
                                                        className={`p-1.5 rounded transition-colors ${item.is_active
                                                            ? "text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-600 dark:hover:text-red-400"
                                                            : "text-amber-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-600"
                                                            }`}
                                                        title={item.is_active ? "Desactivar Ítem" : "Activar Ítem"}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            {item.is_active ? "block" : "check_circle"}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            No se encontraron ítems con los filtros actuales.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="px-6 py-4 bg-white/50 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                Mostrando <span className="font-bold text-slate-900 dark:text-white">{paginatedItems.length}</span> de {" "}
                                <span className="font-bold text-slate-900 dark:text-white">{filteredItems.length}</span> ítems
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1 rounded bg-white/50 dark:bg-slate-700 border border-slate-200/50 dark:border-slate-600 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`h-7 w-7 flex items-center justify-center rounded text-xs font-bold transition-colors ${currentPage === i + 1
                                                ? "bg-blue-600 text-white"
                                                : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1 rounded bg-white/50 dark:bg-slate-700 border border-slate-200/50 dark:border-slate-600 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ItemFormDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                initialData={editingItem}
                companies={companies}
            />
        </div>
    );
}
