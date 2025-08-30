-- Add message status tracking columns
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent';

-- Add index for better performance on status queries (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON public.chat_messages(status);

-- Add ticket protocol to chat_sessions for easier reference
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS ticket_protocol TEXT;

-- Update existing chat_sessions to have ticket_protocol from support_tickets
UPDATE public.chat_sessions 
SET ticket_protocol = st.protocol_number 
FROM public.support_tickets st 
WHERE chat_sessions.ticket_id = st.id 
AND chat_sessions.ticket_protocol IS NULL;