"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BudgetEditorProvider, useBudgetEditor, BudgetState } from "@/contexts/BudgetEditorContext";
import { ItemSearchCommandPalette, CatalogItem } from "./ItemSearchCommandPalette";
import { saveBudgetDraft, updateBudgetStatus, createRevision, closeBudget } from "@/lib/actions/budgets";
import { toast } from "sonner";
import { BudgetGeneralExpenses } from "./BudgetGeneralExpenses";
import { BudgetSummary } from "./BudgetSummary";
import { useBudgetCalculations } from "@/hooks/useBudgetCalculations";
import { BudgetLetterPreviewPanel } from "./BudgetLetterPreviewPanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

interface BudgetEditorClientProps {
    budgetId: string;
    initialData: BudgetState;
    catalogItems: CatalogItem[];
    currentUf: number;
    clientName: string;
}

function EditorUI({ budgetId, catalogItems, currentUf, clientName }: { budgetId: string, catalogItems: CatalogItem[], currentUf: number, clientName: string }) {
    const { state, dispatch } = useBudgetEditor();
    const router = useRouter();
    const calculations = useBudgetCalculations(state, currentUf);
    const [isPaletteOpen, setPaletteOpen] = useState(false);
    const [activePartitionId, setActivePartitionId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [isGeneratingRevision, setIsGeneratingRevision] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
    const [activeUsers, setActiveUsers] = useState<any[]>([]);

    const isReadOnly = state.status !== "draft";

    // Collaborative Presence Effect
    useEffect(() => {
        const supabase = createSupabaseBrowserClient();
        let channel: any;

        const setupPresence = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fullName = user.user_metadata?.full_name || user.email || "Usuario";

            channel = supabase.channel(`budget_room_${budgetId}`, {
                config: {
                    presence: { key: user.id }
                }
            });

            channel
                .on('presence', { event: 'sync' }, () => {
                    const presenceState = channel.presenceState();
                    const stateValues: any = Object.values(presenceState);
                    const users = stateValues.flat();
                    
                    // Deduplicate by user_id
                    const uniqueUsers = Array.from(new Map(users.map((u: any) => [u.user_id, u])).values());
                    setActiveUsers(uniqueUsers);
                })
                .subscribe(async (status: string) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({
                            user_id: user.id,
                            full_name: fullName,
                            email: user.email
                        });
                    }
                });
        };

        setupPresence();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [budgetId]);

    const handleSave = async (isAutoSave = false) => {
        setIsSaving(true);
        try {
            const res = await saveBudgetDraft(budgetId, state);
            if (res.success) {
                if (!isAutoSave) toast.success(res.message);
                dispatch({ type: "MARK_SAVED" });
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Error al guardar el presupuesto");
        } finally {
            setIsSaving(false);
        }
    };

    // Autosave Effect
    useEffect(() => {
        if (!state.hasUnsavedChanges || isReadOnly) return;
        
        const timer = setTimeout(() => {
            handleSave(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, [state, isReadOnly]);

    const handleFinalize = async () => {
        setIsFinalizing(true);
        // We ensure we save the latest draft state first
        await saveBudgetDraft(budgetId, state);

        try {
            toast.loading("Generando PDF y guardando...", { id: "finalize-toast" });

            // 1. Generate PDF Blob Client-Side
            const { pdf } = await import('@react-pdf/renderer');
            const { BudgetProposalPDF } = await import('../pdf/BudgetProposalPDF');
            
            const blob = await pdf(
                <BudgetProposalPDF 
                    state={state} 
                    calculations={calculations} 
                    currentUf={currentUf} 
                    clientName={clientName} 
                    mode="detailed" 
                />
            ).toBlob();

            // 2. Upload to Supabase Storage
            const supabase = createSupabaseBrowserClient();
            const fileName = `Presupuesto_${budgetId}_${Date.now()}.pdf`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('budgets')
                .upload(`${budgetId}/${fileName}`, blob, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            let pdfUrl = undefined;
            if (!uploadError && uploadData) {
                const { data } = supabase.storage.from('budgets').getPublicUrl(uploadData.path);
                pdfUrl = data.publicUrl;
            } else {
                console.error("Error uploading PDF:", uploadError);
            }

            // 3. Update Status and Attached URL
            const res = await updateBudgetStatus(budgetId, "sent", pdfUrl);
            if (res.success) {
                toast.success("Presupuesto Emitido", {
                    id: "finalize-toast",
                    description: "El presupuesto ha sido finalizado y bloqueado."
                });
                dispatch({ type: "UPDATE_ROOT_FIELD", field: "status", value: "sent" });
                dispatch({ type: "MARK_SAVED" });
                router.refresh();
            } else {
                toast.error("Error al finalizar", { id: "finalize-toast", description: res.message });
            }
        } catch (err: any) {
            console.error("Finalize error:", err);
            toast.error("Error", { id: "finalize-toast", description: "Ocurrió un error al procesar el documento." });
        } finally {
            setIsFinalizing(false);
            setShowFinalizeConfirm(false);
        }
    };

    const handleCreateRevision = async () => {
        setIsGeneratingRevision(true);
        // We must save any pending award changes first
        if (state.hasUnsavedChanges) {
            await saveBudgetDraft(budgetId, state);
        }

        toast.loading("Clonando presupuesto...", { id: "revision-toast" });
        const res = await createRevision(budgetId);
        if (res.success && res.data?.id) {
            toast.success("Revisión Creada", { id: "revision-toast", description: res.message });
            router.push(`/budgets/${res.data.id}`);
        } else {
            toast.error("Error", { id: "revision-toast", description: res.message });
            setIsGeneratingRevision(false);
        }
    };

    const handleCloseBudget = async () => {
        setIsClosing(true);
        if (state.hasUnsavedChanges) {
            await saveBudgetDraft(budgetId, state);
        }

        toast.loading("Cambiando estado a Cerrado...", { id: "close-toast" });
        const res = await closeBudget(budgetId);
        if (res.success) {
            toast.success("Presupuesto Cerrado", { id: "close-toast" });
            dispatch({ type: "UPDATE_ROOT_FIELD", field: "status", value: "closed" });
            dispatch({ type: "MARK_SAVED" });
            router.refresh();
        } else {
            toast.error("Error", { id: "close-toast", description: res.message });
        }
        setIsClosing(false);
    };

    const handleOpenPalette = (partitionId: string) => {
        setActivePartitionId(partitionId);
        setPaletteOpen(true);
    };

    const handleSelectItem = (item: CatalogItem) => {
        if (activePartitionId) {
            dispatch({ type: "ADD_LINE", partition_id: activePartitionId, item });
        }
        setPaletteOpen(false);
        setActivePartitionId(null);
    };

    return (
        <div className="flex-1 overflow-y-auto w-full p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-950/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        Opciones de Edición
                        {state.status !== "draft" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20">
                                {state.status === "sent" ? "Enviado/Finalizado" : state.status}
                            </span>
                        )}
                        {state.hasUnsavedChanges && state.status === "draft" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20">Cambios sin guardar</span>
                        )}
                        
                        {/* Avatar Group for Presence */}
                        {activeUsers.length > 0 && (
                            <div className="flex items-center ml-2 border-l border-slate-200 dark:border-slate-800 pl-4 h-6">
                                <div className="flex -space-x-2">
                                    {activeUsers.map((u) => {
                                        const initials = u.full_name ? u.full_name.substring(0, 2).toUpperCase() : "US";
                                        return (
                                            <div 
                                                key={u.user_id} 
                                                className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-[10px] ring-2 ring-white dark:ring-slate-950 shadow-sm"
                                                title={`${u.full_name} (viendo ahora)`}
                                            >
                                                {initials}
                                            </div>
                                        );
                                    })}
                                </div>
                                <span className="text-[10px] text-slate-400 ml-2 font-medium bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-md">
                                    {activeUsers.length} en línea
                                </span>
                            </div>
                        )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Proyecto</span>
                            <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">{state.project_name || "Sin Nombre"}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Ubicación</span>
                            <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">{state.project_location || "Sin Ubicación"}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 py-1 shadow-sm">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Margen Global</span>
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
                                <button
                                    onClick={() => dispatch({ type: "UPDATE_ROOT_FIELD", field: "global_margin", value: Math.max(0, state.global_margin - 0.01) })}
                                    disabled={isReadOnly}
                                    className="px-2 py-0.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                >
                                    -
                                </button>
                                <div className="px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[40px] text-center border-x border-slate-200 dark:border-slate-700">
                                    {(state.global_margin * 100).toFixed(0)}%
                                </div>
                                <button
                                    onClick={() => dispatch({ type: "UPDATE_ROOT_FIELD", field: "global_margin", value: state.global_margin + 0.01 })}
                                    disabled={isReadOnly}
                                    className="px-2 py-0.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleSave(false)}
                        disabled={isSaving || !state.hasUnsavedChanges}
                        className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-lg text-sm disabled:opacity-50 transition-colors shadow-sm focus:outline-none flex items-center gap-2"
                    >
                        {isSaving ? (
                            <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined text-[18px]">save</span>
                        )}
                        {state.status === "draft" ? "Guardar Borrador" : "Guardar Cambios"}
                    </button>
                    <button
                        onClick={() => setIsPreviewOpen(true)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-sm transition-all shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                        Ver Carta
                    </button>
                    <button
                        onClick={() => router.push(`/budgets/${budgetId}/audit`)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-sm transition-all shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">history</span>
                        Ver Historial
                    </button>

                    {state.status === "draft" && (
                        <button
                            onClick={() => setShowFinalizeConfirm(true)}
                            disabled={isFinalizing || isReadOnly || state.hasUnsavedChanges}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            title={state.hasUnsavedChanges ? "Guarda los cambios primero" : ""}
                        >
                            {isFinalizing ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                            Finalizar y Enviar
                        </button>
                    )}

                    {(state.status === "sent" || state.status === "partially_awarded") && (
                        <>
                            <button
                                onClick={handleCreateRevision}
                                disabled={isGeneratingRevision}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isGeneratingRevision ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">content_copy</span>}
                                Nueva Revisión
                            </button>
                            <button
                                onClick={handleCloseBudget}
                                disabled={isClosing}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isClosing ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                                Cerrar Presupuesto
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Partitions List */}
            <div className="space-y-6">
                {state.partitions.map((partition) => (
                    <div key={partition.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
                            <div className="flex flex-1 items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500 font-bold text-xs">{partition.number}</span>
                                <input
                                    value={partition.name}
                                    disabled={isReadOnly}
                                    onChange={(e) => dispatch({ type: "UPDATE_PARTITION_NAME", partition_id: partition.id as string, name: e.target.value })}
                                    className="bg-transparent border-none font-bold text-slate-800 dark:text-slate-200 focus:ring-0 p-0 text-base min-w-[300px] disabled:opacity-80"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                {(state.status === "sent" || state.status === "partially_awarded") && (
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={partition.is_awarded || false}
                                            onChange={() => dispatch({ type: "TOGGLE_AWARD_PARTITION", partition_id: partition.id as string })}
                                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                        />
                                        Adjudicada
                                    </label>
                                )}
                                <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                                    ${Math.round(calculations.partitionTotals[partition.id as string]?.subtotalClp || 0).toLocaleString("es-CL")}
                                </span>
                                {!isReadOnly && (
                                    <button
                                        onClick={() => dispatch({ type: "REMOVE_PARTITION", partition_id: partition.id as string })}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-4">
                            {partition.lines.length === 0 ? (
                                <div className="text-center py-6 text-sm text-slate-500">
                                    No hay líneas en esta partida.
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                            <th className="pb-2 font-medium w-1/2">Descripción</th>
                                            <th className="pb-2 font-medium text-right">Cant.</th>
                                            <th className="pb-2 font-medium text-center">Unid.</th>
                                            <th className="pb-2 font-medium text-right">Mat. ($)</th>
                                            <th className="pb-2 font-medium text-right">HH. ($)</th>
                                            <th className="pb-2 font-medium text-right w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {partition.lines.map((line) => (
                                            <tr key={line.id} className="group">
                                                <td className="py-2.5">
                                                    <input
                                                        value={line.custom_description}
                                                        disabled={isReadOnly}
                                                        onChange={(e) => dispatch({ type: "UPDATE_LINE", partition_id: partition.id as string, line_id: line.id as string, field: "custom_description", value: e.target.value })}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-800 dark:text-slate-300 pointer-events-auto disabled:opacity-80"
                                                    />
                                                </td>
                                                <td className="py-2.5 text-right w-32">
                                                    <div className="flex items-center inline-flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-md overflow-hidden shadow-sm">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                dispatch({ type: "UPDATE_LINE", partition_id: partition.id as string, line_id: line.id as string, field: "quantity", value: Math.max(0.01, line.quantity - 1) });
                                                            }}
                                                            disabled={isReadOnly || line.quantity <= 0.01}
                                                            className="px-2 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">remove</span>
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min={0.01}
                                                            step="any"
                                                            value={line.quantity}
                                                            disabled={isReadOnly}
                                                            onBlur={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (isNaN(val) || val <= 0) {
                                                                    dispatch({ type: "UPDATE_LINE", partition_id: partition.id as string, line_id: line.id as string, field: "quantity", value: 1 });
                                                                }
                                                            }}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (!isNaN(val)) {
                                                                    dispatch({ type: "UPDATE_LINE", partition_id: partition.id as string, line_id: line.id as string, field: "quantity", value: val });
                                                                } else {
                                                                    // Allow temporary empty state while typing, handled by onBlur
                                                                    dispatch({ type: "UPDATE_LINE", partition_id: partition.id as string, line_id: line.id as string, field: "quantity", value: e.target.value as any });
                                                                }
                                                            }}
                                                            className="w-12 bg-transparent border-x border-slate-200 dark:border-slate-700/50 px-1 py-1 text-center text-sm font-bold text-slate-800 dark:text-slate-300 focus:ring-0 disabled:opacity-80"
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                dispatch({ type: "UPDATE_LINE", partition_id: partition.id as string, line_id: line.id as string, field: "quantity", value: line.quantity + 1 });
                                                            }}
                                                            disabled={isReadOnly}
                                                            className="px-2 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">add</span>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 text-center text-slate-500 dark:text-slate-400">{line.unit}</td>
                                                <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400 max-w-[100px]">
                                                    <input
                                                        type="number"
                                                        value={line.material_value_clp}
                                                        disabled={isReadOnly}
                                                        onChange={(e) => dispatch({ type: "UPDATE_LINE", partition_id: partition.id as string, line_id: line.id as string, field: "material_value_clp", value: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-right text-slate-600 dark:text-slate-400 font-mono disabled:opacity-80"
                                                    />
                                                </td>
                                                <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400 max-w-[100px]">
                                                    <input
                                                        type="number"
                                                        value={line.hh_value_clp}
                                                        disabled={isReadOnly}
                                                        onChange={(e) => dispatch({ type: "UPDATE_LINE", partition_id: partition.id as string, line_id: line.id as string, field: "hh_value_clp", value: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-right text-slate-600 dark:text-slate-400 font-mono disabled:opacity-80"
                                                    />
                                                </td>
                                                <td className="py-2.5 text-right">
                                                    {!isReadOnly && (
                                                        <button
                                                            onClick={() => dispatch({ type: "REMOVE_LINE", partition_id: partition.id as string, line_id: line.id as string })}
                                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {!isReadOnly && (
                                <button
                                    onClick={() => handleOpenPalette(partition.id as string)}
                                    className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors w-full justify-center border border-dashed border-blue-200 dark:border-blue-500/30"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Mostrar Catálogo (Cmd + K)
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!isReadOnly && (
                <button
                    onClick={() => dispatch({ type: "ADD_PARTITION", name: `Nueva Partida ${state.partitions.length + 1}` })}
                    className="mt-6 flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all font-bold group"
                >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
                    Agregar Partida
                </button>
            )}

            {isPaletteOpen && (
                <ItemSearchCommandPalette
                    items={catalogItems}
                    onClose={() => setPaletteOpen(false)}
                    onSelect={handleSelectItem}
                />
            )}

            {isPreviewOpen && (
                <BudgetLetterPreviewPanel
                    onClose={() => setIsPreviewOpen(false)}
                    budgetId={budgetId}
                    state={state}
                    calculations={calculations}
                    currentUf={currentUf}
                    clientName={clientName}
                />
            )}

            <div className="mt-8">
                {/* General Expenses */}
                <BudgetGeneralExpenses />

                {/* Budget Summary */}
                <BudgetSummary calculations={calculations} currentUf={currentUf} />
            </div>

            {/* Premium Finalize Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showFinalizeConfirm}
                onClose={() => setShowFinalizeConfirm(false)}
                onConfirm={handleFinalize}
                title="Finalizar Presupuesto"
                description="Esta acción es irreversible. Una vez finalizado, el presupuesto cambiará a estado 'Enviado', las partidas y valores quedarán congelados, y el valor de la UF se fijará al actual. ¿Deseas continuar?"
                icon="lock"
                iconColor="text-blue-500"
                confirmLabel="Sí, Finalizar"
                cancelLabel="Cancelar"
                confirmVariant="primary"
                isLoading={isFinalizing}
            />
        </div>
    );
}

export function BudgetEditorClient(props: BudgetEditorClientProps) {
    return (
        <BudgetEditorProvider initialState={props.initialData}>
            <EditorUI budgetId={props.budgetId} catalogItems={props.catalogItems} currentUf={props.currentUf} clientName={props.clientName} />
        </BudgetEditorProvider>
    );
}
