
-- Add missing columns to chat_configurations table
ALTER TABLE public.chat_configurations 
ADD COLUMN ai_chat_enabled boolean DEFAULT true,
ADD COLUMN whatsapp_enabled boolean DEFAULT false,
ADD COLUMN whatsapp_number text;
