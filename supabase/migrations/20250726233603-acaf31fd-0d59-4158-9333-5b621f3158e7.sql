-- CORREÇÃO DEFINITIVA: Desabilitar RLS temporariamente e recriar políticas corretas

-- Primeiro, desabilitar RLS temporariamente
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- Limpar TODAS as políticas existentes
DROP POLICY IF EXISTS "allow_public_insert_leads" ON public.leads;
DROP POLICY IF EXISTS "allow_authenticated_select_leads" ON public.leads;
DROP POLICY IF EXISTS "allow_authenticated_update_leads" ON public.leads;
DROP POLICY IF EXISTS "allow_authenticated_delete_leads" ON public.leads;

-- Reabilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Criar política de INSERT ultra-permissiva para usuários anônimos e autenticados
CREATE POLICY "public_can_insert_leads" 
ON public.leads 
FOR INSERT 
TO public
WITH CHECK (true);

-- Criar política de SELECT apenas para admins e corretores autenticados
CREATE POLICY "authenticated_admin_corretor_can_select_leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'corretor')
    )
);

-- Criar política de UPDATE apenas para admins e corretores autenticados
CREATE POLICY "authenticated_admin_corretor_can_update_leads" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'corretor')
    )
);

-- Criar política de DELETE apenas para admins e corretores autenticados
CREATE POLICY "authenticated_admin_corretor_can_delete_leads" 
ON public.leads 
FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'corretor')
    )
);

-- Verificar se as políticas foram criadas corretamente
SELECT 
    policyname, 
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'leads'
ORDER BY cmd, policyname;