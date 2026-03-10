import { createSupabaseServerClient } from "@/utils/supabase/server";
import { ClientGrid } from "@/components/database/ClientGrid";

export const metadata = {
    title: "Clientes | VINISE",
};

export default async function ClientsPage() {
    const supabase = await createSupabaseServerClient();
    const { data: clients } = await supabase
        .from("clients")
        .select("*")
        .order("company_name", { ascending: true });

    return (
        <ClientGrid initialClients={clients || []} />
    );
}
