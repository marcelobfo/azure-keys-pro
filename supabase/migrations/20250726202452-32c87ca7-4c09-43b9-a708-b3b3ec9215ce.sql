-- Verificar e limpar políticas existentes de forma mais específica
-- Listar e remover todas as políticas existentes na tabela leads
DO $$
DECLARE
    policy_name text;
BEGIN
    -- Remover todas as políticas existentes na tabela leads
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'leads'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', policy_name);
    END LOOP;
END
$$;

-- Agora criar as políticas limpas
-- 1. Política de INSERT: Qualquer pessoa pode criar leads (incluindo usuários não autenticados)
CREATE POLICY "Public can create leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- 2. Política de SELECT: Apenas admins e corretores podem visualizar leads
CREATE POLICY "Admins and corretores can view leads" 
ON public.leads 
FOR SELECT 
USING (
    auth.uid() IN (
        SELECT profiles.id
        FROM profiles
        WHERE profiles.role = ANY (ARRAY['admin'::user_role, 'corretor'::user_role])
    )
    OR 
    assigned_to = auth.uid()
);

-- 3. Política de UPDATE: Apenas admins e corretores podem atualizar leads
CREATE POLICY "Admins and corretores can update leads" 
ON public.leads 
FOR UPDATE 
USING (
    auth.uid() IN (
        SELECT profiles.id
        FROM profiles
        WHERE profiles.role = ANY (ARRAY['admin'::user_role, 'corretor'::user_role])
    )
    OR 
    assigned_to = auth.uid()
);

-- 4. Política de DELETE: Apenas admins e corretores podem deletar leads
CREATE POLICY "Admins and corretores can delete leads" 
ON public.leads 
FOR DELETE 
USING (
    auth.uid() IN (
        SELECT profiles.id
        FROM profiles
        WHERE profiles.role = ANY (ARRAY['admin'::user_role, 'corretor'::user_role])
    )
);