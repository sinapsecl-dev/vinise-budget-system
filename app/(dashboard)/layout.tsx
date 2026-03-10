import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getCurrentUF } from "@/lib/actions/uf";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userDetails = null;
    if (user) {
        const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
        userDetails = data;
    }

    const currentUf = await getCurrentUF();

    return (
        <div className="flex min-h-screen w-full bg-slate-50 dark:bg-[#0f172a]">
            <Sidebar user={userDetails} />
            <main className="ml-[250px] flex-1 flex flex-col min-h-screen">
                <Header user={userDetails} currentUf={currentUf} />
                <div className="flex-1 w-full bg-[#f6f7f8] dark:bg-[#0f172a]">
                    {children}
                </div>
            </main>
        </div>
    );
}
