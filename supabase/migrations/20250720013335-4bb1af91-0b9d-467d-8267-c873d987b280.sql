
-- Fix notifications_type_check constraint to include 'new_chat_session'
-- This will allow the chat system to create notifications properly

-- First, drop the existing constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Recreate the constraint with all allowed notification types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('property_alert', 'lead_assigned', 'system', 'new_chat_session'));

-- Also ensure the trigger function uses SECURITY DEFINER properly
CREATE OR REPLACE FUNCTION public.notify_new_chat_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert notification for online attendants
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT 
    aa.user_id,
    'new_chat_session',
    'Novo chat em espera',
    format('Cliente %s iniciou um chat sobre: %s', 
      (SELECT name FROM public.leads WHERE id = NEW.lead_id),
      COALESCE(NEW.subject, 'Assunto geral')
    ),
    jsonb_build_object(
      'session_id', NEW.id,
      'lead_id', NEW.lead_id,
      'subject', NEW.subject
    )
  FROM public.attendant_availability aa
  JOIN public.profiles p ON p.id = aa.user_id
  WHERE aa.is_online = true 
    AND aa.current_chats < aa.max_concurrent_chats
    AND p.role IN ('admin', 'corretor');
    
  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_notify_new_chat_session ON public.chat_sessions;
CREATE TRIGGER trigger_notify_new_chat_session
  AFTER INSERT ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_chat_session();
