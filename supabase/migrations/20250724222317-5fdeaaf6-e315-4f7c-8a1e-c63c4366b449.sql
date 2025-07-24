-- Fix remaining 4 functions with search_path
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.hash_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Use SHA-256 with salt for secure hashing
    RETURN crypt(token, gen_salt('bf', 12));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_token(token TEXT, hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN crypt(token, hash) = hash;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.api_tokens 
    SET active = false 
    WHERE expires_at < now() AND active = true;
END;
$$;