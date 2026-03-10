"use client";

import { useState, useMemo } from "react";
import { ClientFormDialog } from "./ClientFormDialog";

interface Props {
    initialClients: any[];
}

export function ClientGrid({ initialClients }: Props) {
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);

    const filteredClients = useMemo(() => {
        return initialClients.filter((client) => {
            const criteria = search.toLowerCase();
            return (
                client.company_name.toLowerCase().includes(criteria) ||
                (client.contact_name && client.contact_name.toLowerCase().includes(criteria)) ||
                (client.city && client.city.toLowerCase().includes(criteria)) ||
                (client.email && client.email.toLowerCase().includes(criteria))
            );
        });
    }, [initialClients, search]);

    function handleCreate() {
        setEditingClient(null);
        setIsDialogOpen(true);
    }

    function handleEdit(client: any) {
        setEditingClient(client);
        setIsDialogOpen(true);
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Clientes</h2>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
                        Gestión centralizada de empresas asociadas y contactos directos.
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-slate-200"
                        />
                    </div>

                    <button
                        onClick={handleCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        <span className="hidden sm:inline">Nuevo Cliente</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredClients.map((client) => (
                    <div
                        key={client.id}
                        className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl p-6 flex flex-col gap-4 transition-all border border-slate-200/80 dark:border-slate-700/80 shadow-xl hover:shadow-2xl group ${!client.is_active ? 'opacity-60' : ''}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="size-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500">
                                <span className="material-symbols-outlined text-3xl">corporate_fare</span>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(client)}
                                    className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                    title="Editar Cliente"
                                >
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1" title={client.company_name}>
                                    {client.company_name}
                                </h3>
                                {!client.is_active && (
                                    <span className="text-[10px] uppercase font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">Inactivo</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-slate-500 dark:text-slate-400 text-sm">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                <span>{client.city || "Sin ciudad especificada"}</span>
                            </div>
                        </div>
                        <div className="space-y-2 mt-2">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">person</span>
                                <span className="text-slate-700 dark:text-slate-300 line-clamp-1">{client.contact_name || "Sin contacto"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">call</span>
                                <span className="text-slate-700 dark:text-slate-300 font-mono">{client.phone || "Sin teléfono"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">mail</span>
                                <span className="truncate text-slate-700 dark:text-slate-300">{client.email || "Sin email"}</span>
                            </div>
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Actividad</span>
                                <span className="text-sm font-medium text-slate-400 dark:text-slate-500 italic">0 presupuestos</span>
                            </div>
                            <button className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                                Ver Presupuestos
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add New Client Card */}
                <div
                    onClick={handleCreate}
                    className="rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform cursor-pointer border-dashed border-2 border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-2xl items-center justify-center min-h-[320px] group hover:border-blue-500 hover:bg-blue-50/80 dark:hover:bg-blue-900/50 shadow-sm hover:shadow-xl"
                >
                    <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">
                        <span className="material-symbols-outlined text-5xl">add_circle</span>
                        <span className="font-bold text-lg text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-500">
                            Agregar Nueva Empresa
                        </span>
                        <p className="text-xs text-center px-8 text-slate-500 dark:text-slate-500/80">
                            Registra un nuevo cliente para gestionar sus presupuestos y proyectos.
                        </p>
                    </div>
                </div>
            </div>

            <ClientFormDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                initialData={editingClient}
            />
        </div>
    );
}
