"use client";

import { useActionState } from "react";
import { loginWithPassword } from "./actions";

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(loginWithPassword, null);

    return (
        <form className="space-y-6" action={formAction}>
            {state?.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">
                    {state.error}
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-300 ml-1" htmlFor="email">
                        Correo electrónico
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <span className="material-symbols-outlined text-xl">mail</span>
                        </div>
                        <input
                            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                            id="email"
                            name="email"
                            placeholder="tu@vinise.cl"
                            required
                            type="email"
                            disabled={isPending}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-300 ml-1" htmlFor="password">
                        Contraseña
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <span className="material-symbols-outlined text-xl">lock</span>
                        </div>
                        <input
                            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            required
                            type="password"
                            disabled={isPending}
                        />
                    </div>
                </div>
            </div>

            <button
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2"
                type="submit"
                disabled={isPending}
            >
                <span>{isPending ? "Ingresando..." : "Iniciar Sesión"}</span>
                <span className="material-symbols-outlined text-xl">
                    {isPending ? "hourglass_empty" : "login"}
                </span>
            </button>
        </form>
    );
}
