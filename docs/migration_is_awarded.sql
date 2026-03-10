-- Migration to add is_awarded column to budget_partitions

ALTER TABLE public.budget_partitions 
ADD COLUMN IF NOT EXISTS is_awarded BOOLEAN NOT NULL DEFAULT FALSE;

-- Opcional: añadir un comentario a la columna
COMMENT ON COLUMN public.budget_partitions.is_awarded IS 'Indicates if this specific partition has been partially awarded by the client';
