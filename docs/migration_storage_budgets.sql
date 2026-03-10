-- Create a secure bucket for storing budget PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('budgets', 'budgets', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the 'budgets' bucket
CREATE POLICY "Users can download their own company budgets"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'budgets' );

CREATE POLICY "Users can upload budgets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'budgets' );

CREATE POLICY "Users can update budgets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'budgets' );
