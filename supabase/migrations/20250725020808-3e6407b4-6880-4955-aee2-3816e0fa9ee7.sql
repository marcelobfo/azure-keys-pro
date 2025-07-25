-- Fase 1: Correção das Políticas RLS Conflitantes
-- Remover a política conflitante que exige autenticação para criar leads
DROP POLICY IF EXISTS "Authenticated users can create leads" ON public.leads;

-- Manter apenas a política que permite qualquer pessoa criar leads
-- Verificar se a política "Anyone can create leads" ainda existe
-- Se não existir, recriar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' 
        AND policyname = 'Anyone can create leads'
    ) THEN
        CREATE POLICY "Anyone can create leads" 
        ON public.leads 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;

-- Adicionar validação básica no nível de banco para leads
-- Criar função para validar dados de leads
CREATE OR REPLACE FUNCTION public.validate_lead_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar email
    IF NEW.email IS NULL OR NEW.email = '' OR NEW.email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
        RAISE EXCEPTION 'Email inválido';
    END IF;
    
    -- Validar nome
    IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 THEN
        RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
    END IF;
    
    -- Sanitizar dados
    NEW.name = trim(NEW.name);
    NEW.email = lower(trim(NEW.email));
    NEW.phone = trim(COALESCE(NEW.phone, ''));
    NEW.message = trim(COALESCE(NEW.message, ''));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para validação
DROP TRIGGER IF EXISTS validate_lead_trigger ON public.leads;
CREATE TRIGGER validate_lead_trigger
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_lead_data();