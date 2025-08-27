-- Fix critical security issue: Restrict access to chat_configurations table with API keys

-- Update the chat_configurations table RLS policies to be admin-only for full access
-- and public for non-sensitive fields only
DROP POLICY IF EXISTS "Users can view chat configurations" ON public.chat_configurations;
DROP POLICY IF EXISTS "Users can insert chat configurations" ON public.chat_configurations;
DROP POLICY IF EXISTS "Users can update chat configurations" ON public.chat_configurations;

-- Create admin-only policies for the main table (full access)
CREATE POLICY "Admin can manage chat configurations" 
ON public.chat_configurations 
FOR ALL
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

-- Create a function that returns public chat configuration data (non-sensitive fields only)
CREATE OR REPLACE FUNCTION public.get_public_chat_config()
RETURNS TABLE (
    id uuid,
    active boolean,
    ai_chat_enabled boolean,
    api_provider text,
    company text,
    welcome_message text,
    system_instruction text,
    custom_responses jsonb,
    knowledge_base_enabled boolean,
    max_tokens integer,
    temperature numeric,
    top_p numeric,
    provider_model text,
    whatsapp_enabled boolean,
    whatsapp_number text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
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
    WHERE active = true
    ORDER BY created_at DESC
    LIMIT 1;
$$;