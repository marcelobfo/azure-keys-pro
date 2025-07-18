-- Remover triggers que podem estar causando problemas com auth.users
DROP TRIGGER IF EXISTS notify_new_chat_session_trigger ON public.chat_sessions;

-- Simplificar política de inserção em chat_sessions para evitar problemas de referência
DROP POLICY IF EXISTS "Qualquer um pode criar sessões de chat" ON public.chat_sessions;

-- Criar política mais específica para inserção de chat_sessions
CREATE POLICY "Sistema pode inserir chat sessions" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (true);

-- Remover política de inserção problemática em chat_messages
DROP POLICY IF EXISTS "Qualquer um pode enviar mensagens" ON public.chat_messages;

-- Criar política específica para inserção de mensagens
CREATE POLICY "Sistema pode inserir mensagens de chat" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);

-- Recriar trigger mais simples sem dependências externas
CREATE OR REPLACE FUNCTION public.notify_new_chat_session_simple()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas inserir notificação simples sem consultas complexas
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT 
    p.id,
    'new_chat_session',
    'Novo chat em espera',
    'Um novo chat foi iniciado',
    jsonb_build_object('session_id', NEW.id)
  FROM public.profiles p
  WHERE p.role IN ('admin', 'corretor');
  
  RETURN NEW;
END;
$$;

-- Recriar trigger simples
CREATE TRIGGER notify_new_chat_session_simple_trigger
  AFTER INSERT ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_chat_session_simple();