-- Função que dispara push notification via HTTP
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Chamar edge function send-push via HTTP POST (assíncrono)
    PERFORM net.http_post(
        url := 'https://vmlnzfodeubthlhjahpc.supabase.co/functions/v1/send-push',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbG56Zm9kZXVidGhsaGphaHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxODcyMDYsImV4cCI6MjA2NDc2MzIwNn0.hA08iqzc6BL3e1cStec5x1h6tZmdLJmH34xGS93WEkc'
        ),
        body := jsonb_build_object('notification_id', NEW.id)
    );
    
    RETURN NEW;
END;
$$;

-- Trigger que executa após inserção de notificação
DROP TRIGGER IF EXISTS on_notification_inserted ON public.notifications;

CREATE TRIGGER on_notification_inserted
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_push_notification();