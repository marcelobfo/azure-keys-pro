-- 1. Primeiro, vamos atualizar os imóveis que estão sem tenant_id
-- Vamos associar ao tenant principal (108654ce-e809-4f06-a86d-800e43c45c5e)
UPDATE properties 
SET tenant_id = '108654ce-e809-4f06-a86d-800e43c45c5e'
WHERE tenant_id IS NULL;

-- 2. Atualizar também os perfis que estão sem tenant_id
UPDATE profiles 
SET tenant_id = '108654ce-e809-4f06-a86d-800e43c45c5e'
WHERE tenant_id IS NULL;

-- 3. Melhorar o trigger para garantir que sempre tenha tenant_id
CREATE OR REPLACE FUNCTION public.set_property_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_tenant_id uuid;
    default_tenant_id uuid;
BEGIN
    -- Se já tem tenant_id definido, mantém
    IF NEW.tenant_id IS NOT NULL THEN
        -- Define user_id se não foi informado
        IF NEW.user_id IS NULL THEN
            NEW.user_id := auth.uid();
        END IF;
        RETURN NEW;
    END IF;
    
    -- Tenta pegar o tenant_id do perfil do usuário
    SELECT tenant_id INTO user_tenant_id
    FROM public.profiles WHERE id = auth.uid();
    
    IF user_tenant_id IS NOT NULL THEN
        NEW.tenant_id := user_tenant_id;
    ELSE
        -- Se usuário não tem tenant (super admin), busca o primeiro tenant disponível
        -- ou o tenant que o super admin está visualizando
        SELECT viewing_tenant_id INTO user_tenant_id
        FROM public.admin_tenant_context
        WHERE user_id = auth.uid();
        
        IF user_tenant_id IS NOT NULL THEN
            NEW.tenant_id := user_tenant_id;
        ELSE
            -- Último recurso: pega o primeiro tenant ativo
            SELECT id INTO default_tenant_id
            FROM public.tenants
            ORDER BY created_at ASC
            LIMIT 1;
            
            NEW.tenant_id := default_tenant_id;
        END IF;
    END IF;
    
    -- Define user_id se não foi informado
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    
    RETURN NEW;
END;
$function$;