-- FASE 1: Diagnóstico e Correção Completa das Políticas RLS para tabela leads

-- Primeiro, desabilitar RLS temporariamente para permitir limpeza completa
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes de forma mais robusta
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    -- Buscar e remover todas as políticas da tabela leads
    FOR policy_rec IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'leads'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_rec.policyname, 
            policy_rec.schemaname, 
            policy_rec.tablename);
        
        RAISE NOTICE 'Removida política: %', policy_rec.policyname;
    END LOOP;
END
$$;

-- Reabilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- CRIAR POLÍTICAS ULTRA-SIMPLES E PERMISSIVAS

-- 1. INSERT: Qualquer pessoa pode criar leads (visitantes anônimos incluídos)
CREATE POLICY "allow_public_insert_leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- 2. SELECT: Apenas usuários autenticados com role admin ou corretor
CREATE POLICY "allow_authenticated_select_leads" 
ON public.leads 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'corretor')
    )
);

-- 3. UPDATE: Apenas usuários autenticados com role admin ou corretor
CREATE POLICY "allow_authenticated_update_leads" 
ON public.leads 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'corretor')
    )
);

-- 4. DELETE: Apenas usuários autenticados com role admin ou corretor  
CREATE POLICY "allow_authenticated_delete_leads" 
ON public.leads 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'corretor')
    )
);

-- Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'leads'
ORDER BY policyname;