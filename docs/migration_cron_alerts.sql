-- Enable pg_cron extension if not already enabled (Requires superuser privileges)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function to be invoked once a day at 8:00 AM UTC
-- Make sure to replace <YOUR_SUPABASE_PROJECT_REF> with the actual project reference
-- The cron job invokes the Supabase Edge Function via HTTP POST
SELECT cron.schedule(
    'review-alerts-daily',
    '0 8 * * *',
    $$
    SELECT net.http_post(
        url:='https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/functions/v1/review-alerts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_ANON_KEY>"}'::jsonb
    )
    $$
);
