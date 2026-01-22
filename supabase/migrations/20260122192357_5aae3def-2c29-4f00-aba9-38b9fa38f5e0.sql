-- 1. Adicionar coluna lead_id à tabela commissions
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id);

-- 2. Deletar todas as comissões existentes (reset)
DELETE FROM commissions;
DELETE FROM corretor_commission_settings;

-- 3. Criar função trigger para gerar comissão automaticamente
CREATE OR REPLACE FUNCTION generate_commission_on_lead_conversion()
RETURNS trigger AS $$
DECLARE
  property_price NUMERIC;
  property_tenant_id UUID;
  commission_rate NUMERIC;
  commission_value NUMERIC;
BEGIN
  -- Só executa quando status muda para 'converted'
  IF NEW.status = 'converted' AND (OLD.status IS NULL OR OLD.status != 'converted') THEN
    -- Verifica se tem corretor atribuído e imóvel
    IF NEW.assigned_to IS NOT NULL AND NEW.property_id IS NOT NULL THEN
      -- Busca preço e tenant do imóvel
      SELECT price, tenant_id INTO property_price, property_tenant_id
      FROM properties WHERE id = NEW.property_id;
      
      -- Busca taxa do corretor ou usa padrão 5%
      SELECT COALESCE(default_rate, 5) INTO commission_rate
      FROM corretor_commission_settings WHERE corretor_id = NEW.assigned_to;
      
      IF commission_rate IS NULL THEN
        commission_rate := 5;
      END IF;
      
      -- Calcula comissão
      IF property_price IS NOT NULL THEN
        commission_value := property_price * commission_rate / 100;
        
        -- Verifica se já existe comissão para este lead
        IF NOT EXISTS (SELECT 1 FROM commissions WHERE lead_id = NEW.id) THEN
          INSERT INTO commissions (
            lead_id, property_id, corretor_id, sale_price, 
            commission_rate, commission_value, status, 
            sale_date, tenant_id
          ) VALUES (
            NEW.id, NEW.property_id, NEW.assigned_to, property_price,
            commission_rate, commission_value, 'pending',
            CURRENT_DATE, COALESCE(property_tenant_id, NEW.tenant_id)
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Criar trigger
DROP TRIGGER IF EXISTS trigger_commission_on_lead_conversion ON leads;
CREATE TRIGGER trigger_commission_on_lead_conversion
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION generate_commission_on_lead_conversion();

-- 5. Atualizar RLS policies para filtrar por tenant
DROP POLICY IF EXISTS "Admin can manage all commissions" ON commissions;
DROP POLICY IF EXISTS "Corretor can view own commissions" ON commissions;
DROP POLICY IF EXISTS "Master can manage all commissions" ON commissions;

CREATE POLICY "Tenant users can view commissions" ON commissions
  FOR SELECT USING (
    is_super_admin() OR 
    (tenant_id = get_user_tenant_id() AND authorize_any(ARRAY['admin'::user_role, 'master'::user_role])) OR
    (corretor_id = auth.uid())
  );

CREATE POLICY "Tenant admins can manage commissions" ON commissions
  FOR ALL USING (
    is_super_admin() OR 
    (tenant_id = get_user_tenant_id() AND authorize_any(ARRAY['admin'::user_role, 'master'::user_role]))
  );

-- 6. Atualizar RLS para corretor_commission_settings
DROP POLICY IF EXISTS "Admin can manage commission settings" ON corretor_commission_settings;
DROP POLICY IF EXISTS "Corretor can view own settings" ON corretor_commission_settings;
DROP POLICY IF EXISTS "Master can manage commission settings" ON corretor_commission_settings;

-- Adicionar tenant_id à tabela de configurações se não existir
ALTER TABLE corretor_commission_settings ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

CREATE POLICY "Tenant admins can manage commission settings" ON corretor_commission_settings
  FOR ALL USING (
    is_super_admin() OR 
    (tenant_id = get_user_tenant_id() AND authorize_any(ARRAY['admin'::user_role, 'master'::user_role]))
  );

CREATE POLICY "Corretor can view own settings" ON corretor_commission_settings
  FOR SELECT USING (corretor_id = auth.uid());