import { createSupabaseServerClient } from "@/utils/supabase/server";
import { ItemClientTable } from "@/components/database/ItemClientTable";

export const metadata = {
    title: "Base de Datos de Ítems | VINISE",
};

export default async function ItemsDatabasePage() {
    const supabase = await createSupabaseServerClient();

    const { data: items, error: itemsError } = await supabase
        .from("items")
        .select(`
            *,
            company:companies(name)
        `)
        .order("created_at", { ascending: false });

    // We also fetch companies to pass to the client component for the <select> element in Form
    const { data: companies, error: companiesError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });

    return (
        <ItemClientTable
            initialItems={items || []}
            companies={companies || []}
        />
    );
}
