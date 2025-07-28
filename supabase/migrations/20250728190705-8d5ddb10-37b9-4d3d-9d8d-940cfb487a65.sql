-- Limpeza completa das políticas RLS para resolver problemas de inserção anônima
-- Desabilitar RLS temporariamente
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS allow_anonymous_insert ON public.leads;
DROP POLICY IF EXISTS allow_admin_corretor_select ON public.leads;
DROP POLICY IF EXISTS allow_admin_corretor_update ON public.leads;
DROP POLICY IF EXISTS allow_admin_corretor_delete ON public.leads;

-- Reabilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Criar política super simples para INSERT público
CREATE POLICY "public_insert_leads" ON public.leads
    FOR INSERT TO public WITH CHECK (true);

-- Recriar políticas para operações de admin/corretor
CREATE POLICY "admin_corretor_all_access" ON public.leads
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'corretor')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'corretor')
    ));