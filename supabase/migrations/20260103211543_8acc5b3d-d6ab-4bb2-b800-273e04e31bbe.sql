-- Criar tabela de seções customizáveis da home
CREATE TABLE IF NOT EXISTS public.home_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    filter_type TEXT NOT NULL DEFAULT 'boolean_field',
    filter_field TEXT,
    filter_value TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    max_items INTEGER DEFAULT 8,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para ordenação e busca por tenant
CREATE INDEX IF NOT EXISTS idx_home_sections_tenant_order ON public.home_sections(tenant_id, display_order);

-- RLS para multi-tenant
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (para home page)
CREATE POLICY "Anyone can view active home sections"
ON public.home_sections FOR SELECT
USING (is_active = true);

-- Política de admin para gerenciar (CRUD completo)
CREATE POLICY "Admins can manage home sections"
ON public.home_sections FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'master')
    )
    OR is_super_admin()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_home_sections_updated_at
    BEFORE UPDATE ON public.home_sections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir seções padrão para cada tenant existente
INSERT INTO public.home_sections (tenant_id, title, filter_type, filter_field, display_order, is_active)
SELECT 
    t.id,
    section_data.title,
    'boolean_field',
    section_data.filter_field,
    section_data.display_order,
    true
FROM public.tenants t
CROSS JOIN (
    VALUES 
        ('Imóveis em Destaque', 'is_featured', 1),
        ('Imóveis Frente Mar', 'is_beachfront', 2),
        ('Imóveis Quadra Mar', 'is_near_beach', 3),
        ('Empreendimentos', 'is_development', 4)
) AS section_data(title, filter_field, display_order)
WHERE NOT EXISTS (
    SELECT 1 FROM public.home_sections hs WHERE hs.tenant_id = t.id
);