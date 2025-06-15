
-- Função para notificar corretores e admin sobre novos leads
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  admin_id uuid;
  corretor_id uuid;
  property_corretor_id uuid;
BEGIN
  -- Notifica o corretor responsável pelo imóvel (se houver)
  IF NEW.property_id IS NOT NULL THEN
    SELECT user_id INTO property_corretor_id FROM properties WHERE id = NEW.property_id;
    IF property_corretor_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        property_corretor_id,
        'lead_assigned',
        'Novo lead atribuído!',
        format('Você recebeu um novo lead: %s (%s)', NEW.name, NEW.email),
        jsonb_build_object(
          'lead_id', NEW.id,
          'property_id', NEW.property_id,
          'name', NEW.name,
          'email', NEW.email
        )
      );
    END IF;
  END IF;

  -- Notifica todos admins
  FOR admin_id IN SELECT id FROM profiles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      admin_id,
      'lead_assigned',
      'Novo lead cadastrado',
      format('Um novo lead foi cadastrado: %s (%s)', NEW.name, NEW.email),
      jsonb_build_object(
        'lead_id', NEW.id,
        'property_id', NEW.property_id,
        'name', NEW.name,
        'email', NEW.email
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Criar trigger na tabela leads
DROP TRIGGER IF EXISTS trigger_new_lead_notify ON leads;
CREATE TRIGGER trigger_new_lead_notify
AFTER INSERT ON leads
FOR EACH ROW EXECUTE FUNCTION public.notify_new_lead();
