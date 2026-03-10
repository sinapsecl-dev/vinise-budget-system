import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Interface for items
interface Item {
    id: string;
    code: string;
    description: string;
    last_reviewed_at: string;
}

serve(async (req) => {
    try {
        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get items that haven't been reviewed in the last 60 days
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const { data: items, error } = await supabaseClient
            .from('items')
            .select('*')
            .lt('last_reviewed_at', sixtyDaysAgo.toISOString())
            .eq('is_active', true);

        if (error) throw error;

        if (items && items.length > 0) {
            // Here you would typically integrate with an email provider like Resend or SendGrid.
            // For now, we log the alert and we could create a notification record if a notifications table existed.
            console.log(`[ALERT] Found ${items.length} items that need review.`);
            
            // Log the codes of the items needing review
            const itemsList = items.map(i => i.code).join(', ');
            console.log(`Items: ${itemsList}`);

            return new Response(
                JSON.stringify({ 
                    message: `Alert triggered for ${items.length} items`,
                    items: items.map(i => ({ code: i.code, description: i.description, last_reviewed_at: i.last_reviewed_at }))
                }),
                { headers: { "Content-Type": "application/json" } },
            )
        }

        return new Response(
            JSON.stringify({ message: "No items need review right now." }),
            { headers: { "Content-Type": "application/json" } },
        )

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
