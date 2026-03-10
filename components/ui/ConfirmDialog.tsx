"use client";

import React, { useEffect, useRef } from "react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    icon?: string;
    iconColor?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: "danger" | "primary" | "success";
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    icon = "warning",
    iconColor = "text-amber-500",
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    confirmVariant = "primary",
    isLoading = false,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const variantClasses = {
        danger: "bg-red-600 hover:bg-red-700 shadow-red-500/20",
        primary: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
        success: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20",
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

            {/* Dialog */}
            <div
                ref={dialogRef}
                className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            >
                {/* Gradient Top Accent */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                <div className="p-6 sm:p-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-5">
                        <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 ${iconColor}`}>
                            <span className="material-symbols-outlined text-[32px]">{icon}</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">
                        {title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                        {description}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 ${variantClasses[confirmVariant]}`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                                    Procesando…
                                </>
                            ) : (
                                confirmLabel
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
