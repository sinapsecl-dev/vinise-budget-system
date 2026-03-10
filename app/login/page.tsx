import LoginForm from "./login-form";

export const metadata = {
    title: "Iniciar Sesión | VINISE Budget System",
};

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full bg-[#f6f7f8] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 antialiased overflow-hidden">
            {/* Decorative light leaks for atmosphere */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Left Side: Decorative Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#0f1729] overflow-hidden items-center justify-center z-10">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "radial-gradient(#3b82f6 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }}
                ></div>

                {/* Glowing geometric pattern */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center p-12 text-center">
                    <div className="mb-8 rounded-2xl bg-white border border-white/10 p-4 backdrop-blur-sm shadow-2xl">
                        <img src="/assets/logo-vinise.svg" alt="VINISE" className="w-40 h-auto object-contain" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">VINISE</h1>
                    <p className="text-slate-400 text-lg max-w-md font-medium">Excelencia en ingeniería eléctrica y presupuestos industriales de alto estándar.</p>
                </div>

                {/* Bottom decorative line */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 bg-gradient-to-br from-slate-900 via-[#0f1729] to-slate-900 z-10">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-10 text-white">
                        <div className="bg-white p-2 rounded-lg">
                            <img src="/assets/logo-vinise.svg" alt="VINISE" className="w-20 h-auto" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">VINISE</span>
                    </div>

                    {/* Glassmorphic Card */}
                    <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-2xl shadow-2xl">
                        <div className="mb-10 text-center lg:text-left">
                            <div className="hidden lg:flex items-center gap-2 mb-4 text-blue-500">
                                <span className="material-symbols-outlined text-3xl">electric_bolt</span>
                                <span className="font-bold tracking-widest text-sm">SISTEMA INTERNO</span>
                            </div>
                            <h2 className="text-3xl font-extrabold text-white mb-2 font-display">Bienvenido a VINISE</h2>
                            <p className="text-slate-400 font-medium">Sistema de Presupuestos Eléctricos</p>
                        </div>

                        <LoginForm />
                    </div>

                    {/* Footer Links */}
                    <div className="mt-12 flex flex-col items-center gap-6">
                        <div className="flex gap-8">
                            <a className="text-slate-500 hover:text-blue-500 text-sm font-medium transition-colors" href="#">Soporte</a>
                            <a className="text-slate-500 hover:text-blue-500 text-sm font-medium transition-colors" href="#">Documentación</a>
                            <a className="text-slate-500 hover:text-blue-500 text-sm font-medium transition-colors" href="#">Privacidad</a>
                        </div>
                        <p className="text-slate-600 text-sm font-medium">
                            © 2026 VINISE — Sistema interno
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
