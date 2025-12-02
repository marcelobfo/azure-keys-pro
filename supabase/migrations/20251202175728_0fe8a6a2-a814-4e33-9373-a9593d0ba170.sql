-- Tabela de comissões
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  corretor_id UUID NOT NULL,
  sale_price NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 5.0,
  commission_value NUMERIC GENERATED ALWAYS AS (sale_price * commission_rate / 100) STORED,
  status TEXT NOT NULL DEFAULT 'pending',
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de configuração de taxa por corretor
CREATE TABLE public.corretor_commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID UNIQUE NOT NULL,
  default_rate NUMERIC NOT NULL DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corretor_commission_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para commissions
CREATE POLICY "Master can manage all commissions" ON public.commissions
FOR ALL USING (authorize('master'::user_role));

CREATE POLICY "Admin can manage all commissions" ON public.commissions
FOR ALL USING (authorize('admin'::user_role));

CREATE POLICY "Corretor can view own commissions" ON public.commissions
FOR SELECT USING (corretor_id = auth.uid());

-- Políticas para corretor_commission_settings
CREATE POLICY "Master can manage commission settings" ON public.corretor_commission_settings
FOR ALL USING (authorize('master'::user_role));

CREATE POLICY "Admin can manage commission settings" ON public.corretor_commission_settings
FOR ALL USING (authorize('admin'::user_role));

CREATE POLICY "Corretor can view own settings" ON public.corretor_commission_settings
FOR SELECT USING (corretor_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_commissions_updated_at
BEFORE UPDATE ON public.commissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_settings_updated_at
BEFORE UPDATE ON public.corretor_commission_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();