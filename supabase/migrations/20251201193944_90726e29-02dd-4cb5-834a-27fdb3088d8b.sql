-- Add custom welcome message field for WhatsApp lead notifications
ALTER TABLE public.chat_configurations 
ADD COLUMN IF NOT EXISTS whatsapp_lead_welcome_message text DEFAULT 'Olá {name}! 👋

Recebemos seu interesse em nossos imóveis!

Um de nossos corretores especializados entrará em contato em breve para ajudá-lo a encontrar o imóvel ideal.

Obrigado por nos escolher! 🏠';