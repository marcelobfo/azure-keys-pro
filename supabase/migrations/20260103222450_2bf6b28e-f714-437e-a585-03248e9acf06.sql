-- Tabela de tags centralizadas por tenant
CREATE TABLE IF NOT EXISTS public.property_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    color TEXT DEFAULT '#6b7280',
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

-- Índices para performance
CREATE INDEX idx_property_tags_tenant ON public.property_tags(tenant_id);
CREATE INDEX idx_property_tags_slug ON public.property_tags(tenant_id, slug);

-- RLS
ALTER TABLE public.property_tags ENABLE ROW LEVEL SECURITY;

-- Leitura pública para exibição
CREATE POLICY "Anyone can view active property tags"
ON public.property_tags FOR SELECT
USING (is_active = true);

-- Admins podem gerenciar tags do tenant
CREATE POLICY "Admins can manage property tags"
ON public.property_tags FOR ALL
USING (
    (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'master')
    )) OR is_super_admin()
);

-- Trigger para updated_at
CREATE TRIGGER update_property_tags_updated_at
    BEFORE UPDATE ON public.property_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migrar tags existentes para a nova tabela
INSERT INTO public.property_tags (tenant_id, name, slug, color)
SELECT DISTINCT 
    p.tenant_id,
    tag as name,
    lower(regexp_replace(tag, '[^a-zA-Z0-9]', '-', 'g')) as slug,
    '#6b7280' as color
FROM public.properties p,
     unnest(p.tags) as tag
WHERE p.tags IS NOT NULL 
  AND array_length(p.tags, 1) > 0
  AND p.tenant_id IS NOT NULL
ON CONFLICT (tenant_id, slug) DO NOTHING;