-- Habilitar real-time para tabela de notificações
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Adicionar à publicação do real-time
BEGIN;
  -- Remove from publication if already exists (to avoid errors)
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create publication with all necessary tables
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.notifications,
    public.leads,
    public.visits,
    public.chat_messages,
    public.chat_sessions;
COMMIT;