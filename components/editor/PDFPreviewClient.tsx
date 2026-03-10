"use client";

import React, { useState, useEffect } from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { BudgetProposalPDF } from "../pdf/BudgetProposalPDF";
import { createPortal } from "react-dom";

interface PDFPreviewClientProps {
    onClose?: () => void;
    budgetId: string;
    state: any;
    calculations: any;
    currentUf: number;
    clientName: string;
}

export default function PDFPreviewClient({ onClose, budgetId, state, calculations, currentUf, clientName }: PDFPreviewClientProps) {
    const [isClient, setIsClient] = useState(false);
    const [pdfMode, setPdfMode] = useState<"general" | "detailed">("general");

    useEffect(() => {
        setIsClient(true);
    }, []);

    const MyDoc = (
        <BudgetProposalPDF
            state={state}
            calculations={calculations}
            currentUf={currentUf}
            clientName={clientName}
            mode={pdfMode}
        />
    );

    return isClient ? createPortal(
        <>
            {/* Side Panel Overlay */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Right Side Panel */}
            <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] md:w-[600px] lg:w-[50%] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl transition-transform transform translate-x-0">
                {/* Header */}
                <header className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Vista Previa de Carta PDF</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{state.project_name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-fit self-center sm:self-start">
                        <button
                            onClick={() => setPdfMode("general")}
                            className={`flex-1 sm:px-6 py-2 rounded-md text-sm font-bold transition-all ${pdfMode === "general" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"}`}
                        >
                            Modo General
                        </button>
                        <button
                            onClick={() => setPdfMode("detailed")}
                            className={`flex-1 sm:px-6 py-2 rounded-md text-sm font-bold transition-all ${pdfMode === "detailed" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"}`}
                        >
                            Modo Desglosado
                        </button>
                    </div>
                </header>

                {/* Preview Area */}
                <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 flex justify-center items-start">
                    {isClient ? (
                        <PDFViewer className="w-full h-[800px] border-0 rounded-lg shadow-xl" showToolbar={true}>
                            {MyDoc}
                        </PDFViewer>
                    ) : (
                        <div className="flex items-center justify-center w-full h-full min-h-[500px]">Cargando vista previa...</div>
                    )}
                </main>

                {/* Footer Controls */}
                <footer className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <div className="flex items-center justify-end gap-4">
                        <button onClick={onClose} className="px-4 py-2 font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                            Cancelar
                        </button>
                        {isClient && (
                            <PDFDownloadLink
                                document={MyDoc}
                                fileName={`Presupuesto_${budgetId}_${pdfMode === "general" ? "General" : "Desglosado"}.pdf`}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                            >
                                {({ blob, url, loading, error }) =>
                                    loading ? 'Generando PDF...' : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">download</span>
                                            Descargar
                                        </>
                                    )
                                }
                            </PDFDownloadLink>
                        )}
                    </div>
                </footer>
            </div>
        </>,
        document.body
    ) : null;
}
