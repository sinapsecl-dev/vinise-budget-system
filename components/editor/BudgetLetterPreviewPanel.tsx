"use client";

import dynamic from "next/dynamic";
import React from "react";

// The PDFViewer causes issues with Next.js App Router (ESM/SSR errors),
// so we MUST dynamically import the component that renders it, with ssr: false.
const PDFPreviewDynamic = dynamic(() => import("./PDFPreviewClient"), {
    ssr: false,
    loading: () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
                <span className="material-symbols-outlined animate-spin text-blue-500 text-[32px]">refresh</span>
                <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">Cargando motor PDF...</p>
            </div>
        </div>
    ),
});

interface BudgetLetterPreviewPanelProps {
    onClose?: () => void;
    budgetId: string;
    state: any;
    calculations: any;
    currentUf: number;
    clientName: string;
}

export function BudgetLetterPreviewPanel(props: BudgetLetterPreviewPanelProps) {
    return <PDFPreviewDynamic {...props} />;
}
