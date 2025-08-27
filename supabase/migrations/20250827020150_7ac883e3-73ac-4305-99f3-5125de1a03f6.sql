-- Melhorar o sistema de IA para ter mais contexto sobre o site e imóveis
-- Adicionar funções para buscar dados do site para contexto da IA

-- Função para obter informações públicas do site para contexto da IA
CREATE OR REPLACE FUNCTION public.get_site_context_for_ai()
RETURNS TABLE(
  total_properties integer,
  featured_properties jsonb,
  site_info jsonb,
  property_types text[],
  cities text[],
  price_ranges jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    (SELECT COUNT(*)::integer FROM public.properties WHERE status = 'active') as total_properties,
    
    (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', id,
      'title', title,
      'price', price,
      'location', location,
      'city', city,
      'property_type', property_type,
      'bedrooms', bedrooms,
      'bathrooms', bathrooms,
      'area', area,
      'images', CASE WHEN jsonb_array_length(images) > 0 THEN jsonb_build_array(images->0) ELSE '[]'::jsonb END,
      'slug', slug
    )), '[]'::jsonb)
    FROM public.properties 
    WHERE status = 'active' AND featured = true 
    ORDER BY created_at DESC 
    LIMIT 6) as featured_properties,
    
    (SELECT jsonb_build_object(
      'name', 'Imobiliária',
      'description', 'Encontre o imóvel dos seus sonhos',
      'services', jsonb_build_array(
        'Compra e venda de imóveis',
        'Agendamento de visitas',
        'Consultoria imobiliária',
        'Financiamento imobiliário'
      )
    )) as site_info,
    
    (SELECT array_agg(DISTINCT property_type) 
     FROM public.properties WHERE status = 'active') as property_types,
    
    (SELECT array_agg(DISTINCT city) 
     FROM public.properties WHERE status = 'active' AND city IS NOT NULL) as cities,
    
    (SELECT jsonb_build_object(
      'min_price', MIN(price),
      'max_price', MAX(price),
      'avg_price', AVG(price)::integer
    ) FROM public.properties WHERE status = 'active' AND price > 0) as price_ranges;
$$;

-- Função para buscar imóveis com filtros específicos para a IA
CREATE OR REPLACE FUNCTION public.search_properties_for_ai(
  search_type text DEFAULT NULL,
  search_city text DEFAULT NULL,
  min_price numeric DEFAULT NULL,
  max_price numeric DEFAULT NULL,
  min_bedrooms integer DEFAULT NULL,
  max_bedrooms integer DEFAULT NULL,
  property_type_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  title text,
  price numeric,
  location text,
  city text,
  property_type text,
  bedrooms integer,
  bathrooms integer,
  area numeric,
  description text,
  slug text,
  main_image text
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.title,
    p.price,
    p.location,
    p.city,
    p.property_type,
    p.bedrooms,
    p.bathrooms,
    p.area,
    p.description,
    p.slug,
    CASE 
      WHEN jsonb_array_length(p.images) > 0 
      THEN p.images->0->>'url'
      ELSE NULL 
    END as main_image
  FROM public.properties p
  WHERE p.status = 'active'
    AND (search_type IS NULL OR p.property_type ILIKE '%' || search_type || '%')
    AND (search_city IS NULL OR p.city ILIKE '%' || search_city || '%')
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (min_bedrooms IS NULL OR p.bedrooms >= min_bedrooms)
    AND (max_bedrooms IS NULL OR p.bedrooms <= max_bedrooms)
    AND (property_type_filter IS NULL OR p.property_type = property_type_filter)
  ORDER BY 
    CASE WHEN p.featured THEN 0 ELSE 1 END,
    p.created_at DESC
  LIMIT 20;
$$;

-- Tabela para melhorar o contexto das conversas de chat
CREATE TABLE IF NOT EXISTS public.chat_context_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid UNIQUE REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_preferences jsonb DEFAULT '{}'::jsonb,
  search_history jsonb DEFAULT '[]'::jsonb,
  interaction_count integer DEFAULT 0,
  last_properties_shown jsonb DEFAULT '[]'::jsonb,
  user_intent text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS para chat_context_memory
ALTER TABLE public.chat_context_memory ENABLE ROW LEVEL SECURITY;

-- Policy para permitir leitura/escrita baseada na sessão
CREATE POLICY "Allow session access to context memory"
ON public.chat_context_memory
FOR ALL
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_chat_context_memory_updated_at
  BEFORE UPDATE ON public.chat_context_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();