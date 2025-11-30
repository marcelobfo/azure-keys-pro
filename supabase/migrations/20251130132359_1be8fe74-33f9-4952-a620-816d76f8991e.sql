-- Remove duplicate active chat_configurations, keep only the most recent one
WITH ranked_configs AS (
  SELECT id, 
         ROW_NUMBER() OVER (ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST) as rn
  FROM public.chat_configurations
  WHERE active = true
)
UPDATE public.chat_configurations 
SET active = false 
WHERE id IN (
  SELECT id FROM ranked_configs WHERE rn > 1
);