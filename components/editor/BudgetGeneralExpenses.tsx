"use client";

import React from "react";
import { useBudgetEditor } from "@/contexts/BudgetEditorContext";

export function BudgetGeneralExpenses() {
    const { state, dispatch } = useBudgetEditor();
    const isReadOnly = state.status !== "draft";

    if (state.general_expenses.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
                <p className="text-slate-500 font-medium mb-4">No hay gastos generales asignados a este presupuesto.</p>
                {!isReadOnly && (
                    <button
                        onClick={() => dispatch({ type: "ADD_GENERAL_EXPENSE" })}
                        className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-bold rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Agregar Gasto General
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-purple-500">receipt_long</span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Gastos Generales</h3>
                </div>
                {!isReadOnly && (
                    <button
                        onClick={() => dispatch({ type: "ADD_GENERAL_EXPENSE" })}
                        className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors border border-dashed border-blue-200 dark:border-blue-500/30"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Agregar Gasto
                    </button>
                )}
            </div>

            <div className="p-0">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
                            <th className="px-5 py-3 font-medium w-1/3">Nombre del Gasto</th>
                            <th className="px-5 py-3 font-medium">Asignación</th>
                            <th className="px-5 py-3 font-medium text-right">Monto Total ($)</th>
                            <th className="px-5 py-3 font-medium text-right w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {state.general_expenses.map((expense) => (
                            <tr key={expense.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="px-5 py-3">
                                    <input
                                        value={expense.name}
                                        disabled={isReadOnly}
                                        onChange={(e) => dispatch({
                                            type: "UPDATE_GENERAL_EXPENSE",
                                            expense_id: expense.id as string,
                                            field: "name",
                                            value: e.target.value
                                        })}
                                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded p-1 text-slate-800 dark:text-slate-300 font-medium disabled:opacity-80"
                                        placeholder="Ej: Camioneta Supervisor"
                                    />
                                </td>
                                <td className="px-5 py-3">
                                    <select
                                        value={expense.allocation}
                                        disabled={isReadOnly}
                                        onChange={(e) => dispatch({
                                            type: "UPDATE_GENERAL_EXPENSE",
                                            expense_id: expense.id as string,
                                            field: "allocation",
                                            value: e.target.value
                                        })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/50 outline-none text-sm disabled:opacity-80"
                                    >
                                        <option value="A">Equitativo (Todas las partidas)</option>
                                        <optgroup label="Partidas Específicas">
                                            {state.partitions.map(p => (
                                                <option key={p.id} value={p.id}>{p.number}. {p.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <input
                                        type="number"
                                        value={expense.value_clp || ""}
                                        disabled={isReadOnly}
                                        onChange={(e) => dispatch({
                                            type: "UPDATE_GENERAL_EXPENSE",
                                            expense_id: expense.id as string,
                                            field: "value_clp",
                                            value: parseFloat(e.target.value) || 0
                                        })}
                                        className="w-full max-w-[150px] ml-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/50 rounded px-2 py-1.5 text-right text-slate-800 dark:text-slate-300 font-mono shadow-inner focus:ring-2 focus:ring-blue-500/50 outline-none disabled:opacity-80"
                                        placeholder="0"
                                    />
                                </td>
                                <td className="px-5 py-3 text-right">
                                    {!isReadOnly && (
                                        <button
                                            onClick={() => dispatch({ type: "REMOVE_GENERAL_EXPENSE", expense_id: expense.id as string })}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10"
                                            title="Eliminar Gasto"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
