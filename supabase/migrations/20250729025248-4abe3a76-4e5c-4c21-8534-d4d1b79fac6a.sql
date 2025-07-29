-- Diagnóstico e correção completa do problema RLS na tabela leads
-- Forçar reset de cache e recriar políticas com abordagem mais robusta

-- 1. Desabilitar RLS completamente
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes (qualquer variação de nome)
DO $$ 
DECLARE
    policy_record record;
BEGIN
    FOR policy_record IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'leads' AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', policy_record.policyname);
    END LOOP;
END $$;

-- 3. Garantir permissões explícitas para o role anon
GRANT INSERT ON public.leads TO anon;
GRANT SELECT ON public.leads TO authenticated;
GRANT UPDATE ON public.leads TO authenticated;
GRANT DELETE ON public.leads TO authenticated;

-- 4. Reabilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 5. Criar política mais simples possível para INSERT anônimo
CREATE POLICY "allow_anonymous_insert" ON public.leads
    FOR INSERT TO anon
    WITH CHECK (true);

-- 6. Política para operações autenticadas (admin/corretor)
CREATE POLICY "allow_authenticated_operations" ON public.leads
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

-- 7. Teste direto de inserção no SQL para verificar se funciona
INSERT INTO public.leads (name, email, phone, message, status) 
VALUES ('Teste Sistema', 'teste@sistema.com', '123456789', 'Teste de inserção direta', 'new');

-- 8. Forçar refresh do schema cache
NOTIFY pgrst, 'reload schema';