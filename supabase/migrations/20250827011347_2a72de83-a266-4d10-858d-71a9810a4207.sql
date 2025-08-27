-- Fix critical security issue: Restrict access to chat_configurations table with API keys

-- First, create a view for public access to non-sensitive chat configuration data
CREATE OR REPLACE VIEW public.chat_config_public AS 
SELECT 
    id,
    active,
    ai_chat_enabled,
    api_provider,
    company,
    welcome_message,
    system_instruction,
    custom_responses,
    knowledge_base_enabled,
    max_tokens,
    temperature,
    top_p,
    provider_model,
    whatsapp_enabled,
    whatsapp_number,
    created_at,
    updated_at
FROM public.chat_configurations
WHERE active = true;

-- Enable RLS on the view
ALTER VIEW public.chat_config_public SET (security_barrier = true);
CREATE POLICY "Anyone can view public chat config" ON public.chat_config_public FOR SELECT USING (true);

-- Now update the chat_configurations table RLS policies to be admin-only
DROP POLICY IF EXISTS "Users can view chat configurations" ON public.chat_configurations;
DROP POLICY IF EXISTS "Users can insert chat configurations" ON public.chat_configurations;
DROP POLICY IF EXISTS "Users can update chat configurations" ON public.chat_configurations;

-- Create admin-only policies for the main table
CREATE POLICY "Admin can view chat configurations" 
ON public.chat_configurations 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admin can insert chat configurations" 
ON public.chat_configurations 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admin can update chat configurations" 
ON public.chat_configurations 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
) 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admin can delete chat configurations" 
ON public.chat_configurations 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);