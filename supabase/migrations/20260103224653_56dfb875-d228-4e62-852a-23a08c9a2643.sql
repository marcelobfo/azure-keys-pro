-- Adicionar coluna para filtros múltiplos
ALTER TABLE public.home_sections 
ADD COLUMN IF NOT EXISTS filters JSONB DEFAULT '[]'::jsonb;

-- Migrar dados existentes para o novo formato
UPDATE public.home_sections
SET filters = 
  CASE 
    WHEN filter_type = 'boolean_field' AND filter_field IS NOT NULL THEN
      jsonb_build_array(jsonb_build_object('type', 'boolean_field', 'field', filter_field, 'value', 'true'))
    WHEN filter_type IN ('tag', 'property_type', 'city', 'purpose') AND filter_value IS NOT NULL THEN
      jsonb_build_array(jsonb_build_object('type', filter_type, 'field', NULL, 'value', filter_value))
    ELSE '[]'::jsonb
  END
WHERE filters = '[]'::jsonb OR filters IS NULL;

-- Criar índice para performance em queries com filtros
CREATE INDEX IF NOT EXISTS idx_home_sections_filters ON public.home_sections USING gin(filters);