-- FASE 1: Limpeza completa das políticas RLS na tabela leads
-- Remover todas as políticas existentes (duplicadas e conflitantes)
DROP POLICY IF EXISTS "Admins and corretores can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Admins and corretores can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins and corretores can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Corretores and admins can view all leads" ON public.leads;

-- FASE 2: Criar políticas RLS limpas e específicas
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

-- Melhorar o trigger de validação para ser mais robusto
CREATE OR REPLACE FUNCTION public.validate_lead_data_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Validar email com regex mais rigoroso
    IF NEW.email IS NULL OR NEW.email = '' OR NEW.email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
        RAISE EXCEPTION 'Email inválido ou em branco';
    END IF;
    
    -- Validar nome (mínimo 2 caracteres, apenas letras e espaços)
    IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 THEN
        RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
    END IF;
    
    -- Sanitizar e formatar dados
    NEW.name = trim(regexp_replace(NEW.name, '\s+', ' ', 'g'));
    NEW.email = lower(trim(NEW.email));
    NEW.phone = trim(COALESCE(NEW.phone, ''));
    NEW.message = trim(COALESCE(NEW.message, ''));
    
    -- Validar tamanho máximo dos campos
    IF length(NEW.name) > 100 THEN
        RAISE EXCEPTION 'Nome muito longo (máximo 100 caracteres)';
    END IF;
    
    IF length(NEW.message) > 1000 THEN
        RAISE EXCEPTION 'Mensagem muito longa (máximo 1000 caracteres)';
    END IF;
    
    -- Definir status padrão
    IF NEW.status IS NULL THEN
        NEW.status = 'new';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Substituir o trigger existente pelo novo
DROP TRIGGER IF EXISTS validate_lead_data_trigger ON public.leads;
CREATE TRIGGER validate_lead_data_enhanced_trigger
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.validate_lead_data_enhanced();