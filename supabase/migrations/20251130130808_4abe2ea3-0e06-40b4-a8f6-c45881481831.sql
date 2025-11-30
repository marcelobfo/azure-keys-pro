-- Add missing columns to chat_configurations for WhatsApp settings
ALTER TABLE public.chat_configurations 
ADD COLUMN IF NOT EXISTS whatsapp_position TEXT DEFAULT 'left',
ADD COLUMN IF NOT EXISTS whatsapp_icon_url TEXT,
ADD COLUMN IF NOT EXISTS evolution_api_url TEXT,
ADD COLUMN IF NOT EXISTS evolution_api_key TEXT,
ADD COLUMN IF NOT EXISTS evolution_instance TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_notification_number TEXT;