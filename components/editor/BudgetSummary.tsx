"use client";

import React from "react";
import { BudgetCalculations } from "@/hooks/useBudgetCalculations";

interface BudgetSummaryProps {
    calculations: BudgetCalculations;
    currentUf: number;
}

export function BudgetSummary({ calculations, currentUf }: BudgetSummaryProps) {
    // Helper formats
    const formatClp = (val: number) => `$${Math.round(val).toLocaleString("es-CL")}`;
    const formatUf = (val: number) => `UF ${val.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden mt-6 mb-12">
            <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400">payments</span>
                    Resumen del Presupuesto
                </h3>
                <div className="flex gap-4 text-sm font-medium">
                    <span className="text-slate-400">Valor UF Hoy:</span>
                    <span className="text-emerald-400">
                        ${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currentUf)}
                    </span>
                </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-10">
                {/* Desglose Left Side */}
                <div className="flex-1 space-y-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Desglose de Costos</h4>

                    <div className="flex justify-between items-end border-b border-slate-800 pb-3">
                        <span className="text-slate-300 font-medium">Materiales Base</span>
                        <span className="text-white font-mono text-lg">{formatClp(calculations.totalMaterialClp)}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-800 pb-3">
                        <span className="text-slate-300 font-medium">Mano de Obra (HH) Base</span>
                        <span className="text-white font-mono text-lg">{formatClp(calculations.totalHhClp)}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-800 pb-3">
                        <span className="text-slate-400 font-medium ml-4">Costo Directo Puro</span>
                        <span className="text-slate-400 font-mono italic">{formatClp(calculations.baseCostClp)}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-800 pb-3 pt-2">
                        <span className="text-blue-300 font-medium">Utilidad / Margen</span>
                        <span className="text-blue-300 font-mono text-lg">+{formatClp(calculations.totalMarginClp)}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-800 pb-3">
                        <span className="text-purple-300 font-medium">Gastos Generales</span>
                        <span className="text-purple-300 font-mono text-lg">+{formatClp(calculations.generalExpensesTotal)}</span>
                    </div>
                </div>

                {/* Totals Right Side - Card Style */}
                <div className="flex-1">
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 h-full flex flex-col justify-center">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 font-medium">Subtotal Neto</span>
                                <span className="text-white font-mono text-xl">{formatClp(calculations.subtotalNetoClp)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">IVA (19%)</span>
                                <span className="text-slate-400 font-mono">+{formatClp(calculations.totalIvaClp)}</span>
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-700/80">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-white font-bold text-lg">Total a Cobrar</span>
                                    <span className="text-emerald-400 font-mono text-3xl font-bold tracking-tight">{formatClp(calculations.totalFinalClp)}</span>
                                </div>
                                <div className="flex justify-end">
                                    <span className="bg-slate-900 text-slate-300 px-3 py-1 rounded text-sm font-mono border border-slate-700">
                                        {formatUf(calculations.totalFinalUf)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
