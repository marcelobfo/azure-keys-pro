-- ========================================
-- SECURITY FIXES MIGRATION
-- ========================================

-- 1. Create cryptographically secure token generation function
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token_bytes BYTEA;
    token_string TEXT;
BEGIN
    -- Generate 32 random bytes
    token_bytes := gen_random_bytes(32);
    -- Convert to base64 and make URL-safe
    token_string := 'reit_' || encode(token_bytes, 'base64');
    token_string := replace(replace(replace(token_string, '+', '-'), '/', '_'), '=', '');
    RETURN token_string;
END;
$$;

-- 2. Create secure hash function using pgcrypto
CREATE OR REPLACE FUNCTION public.hash_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Use SHA-256 with salt for secure hashing
    RETURN crypt(token, gen_salt('bf', 12));
END;
$$;

-- 3. Create token verification function
CREATE OR REPLACE FUNCTION public.verify_token(token TEXT, hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN crypt(token, hash) = hash;
END;
$$;

-- 4. Fix overly permissive RLS policies on chat_sessions
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can update chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can view chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Sistema pode inserir chat sessions" ON public.chat_sessions;

-- Create proper RLS policies for chat_sessions
CREATE POLICY "System can insert chat sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Attendants can view assigned sessions" ON public.chat_sessions
    FOR SELECT USING (
        attendant_id = auth.uid() OR 
        auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.role IN ('admin', 'corretor')
        )
    );

CREATE POLICY "Attendants can update assigned sessions" ON public.chat_sessions
    FOR UPDATE USING (
        attendant_id = auth.uid() OR 
        auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.role IN ('admin', 'corretor')
        )
    );

CREATE POLICY "Leads can view their own sessions" ON public.chat_sessions
    FOR SELECT USING (
        lead_id IN (
            SELECT leads.id FROM leads 
            WHERE leads.email = (
                SELECT users.email FROM auth.users 
                WHERE users.id = auth.uid()
            )
        )
    );

-- 5. Fix overly permissive RLS policies on leads
DROP POLICY IF EXISTS "Users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads" ON public.leads;

-- Create proper RLS policies for leads
CREATE POLICY "Authenticated users can create leads" ON public.leads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins and corretores can view all leads" ON public.leads
    FOR SELECT USING (
        auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.role IN ('admin', 'corretor')
        ) OR
        assigned_to = auth.uid()
    );

CREATE POLICY "Admins and corretores can update leads" ON public.leads
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.role IN ('admin', 'corretor')
        ) OR
        assigned_to = auth.uid()
    );

-- 6. Fix overly permissive RLS policies on visits
DROP POLICY IF EXISTS "Users can insert visits" ON public.visits;
DROP POLICY IF EXISTS "Users can update visits" ON public.visits;
DROP POLICY IF EXISTS "Users can view visits" ON public.visits;
DROP POLICY IF EXISTS "Users can delete visits" ON public.visits;

-- Create proper RLS policies for visits
CREATE POLICY "Authenticated users can create visits" ON public.visits
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins and corretores can view all visits" ON public.visits
    FOR SELECT USING (
        auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.role IN ('admin', 'corretor')
        )
    );

CREATE POLICY "Admins and corretores can update visits" ON public.visits
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.role IN ('admin', 'corretor')
        )
    );

CREATE POLICY "Admins and corretores can delete visits" ON public.visits
    FOR DELETE USING (
        auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.role IN ('admin', 'corretor')
        )
    );

-- 7. Add token expiration and cleanup
ALTER TABLE public.api_tokens 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 year');

-- Create function to cleanup expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.api_tokens 
    SET active = false 
    WHERE expires_at < now() AND active = true;
END;
$$;

-- 8. Fix database function security by setting search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_id uuid;
    corretor_id uuid;
    property_corretor_id uuid;
BEGIN
    -- Notifica o corretor responsável pelo imóvel (se houver)
    IF NEW.property_id IS NOT NULL THEN
        SELECT user_id INTO property_corretor_id FROM properties WHERE id = NEW.property_id;
        IF property_corretor_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (
                property_corretor_id,
                'lead_assigned',
                'Novo lead atribuído!',
                format('Você recebeu um novo lead: %s (%s)', NEW.name, NEW.email),
                jsonb_build_object(
                    'lead_id', NEW.id,
                    'property_id', NEW.property_id,
                    'name', NEW.name,
                    'email', NEW.email
                )
            );
        END IF;
    END IF;

    -- Notifica todos admins
    FOR admin_id IN SELECT id FROM profiles WHERE role = 'admin'
    LOOP
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            admin_id,
            'lead_assigned',
            'Novo lead cadastrado',
            format('Um novo lead foi cadastrado: %s (%s)', NEW.name, NEW.email),
            jsonb_build_object(
                'lead_id', NEW.id,
                'property_id', NEW.property_id,
                'name', NEW.name,
                'email', NEW.email
            )
        );
    END LOOP;

    RETURN NEW;
END;
$$;

-- 9. Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
    FOR SELECT USING (
        auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON public.security_audit_log
    FOR INSERT WITH CHECK (true);