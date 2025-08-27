-- Create missing foreign key for chat_messages sender_id
ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id);

-- Create index for better performance on message queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_timestamp 
ON public.chat_messages(session_id, timestamp);

-- Create chat context memory table for bot memory
CREATE TABLE public.chat_context_memory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat context memory
ALTER TABLE public.chat_context_memory ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat context memory
CREATE POLICY "System can manage chat memory" 
ON public.chat_context_memory 
FOR ALL 
USING (true);

-- Create unique constraint for session_id + key
CREATE UNIQUE INDEX idx_chat_context_memory_session_key 
ON public.chat_context_memory(session_id, key);

-- Create function to get site context for AI
CREATE OR REPLACE FUNCTION public.get_site_context_for_ai()
RETURNS JSONB
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT jsonb_build_object(
        'company', COALESCE((SELECT value FROM site_settings WHERE key = 'company_name'), 'Imobiliária'),
        'phone', COALESCE((SELECT value FROM site_settings WHERE key = 'phone'), ''),
        'email', COALESCE((SELECT value FROM site_settings WHERE key = 'email'), ''),
        'address', COALESCE((SELECT value FROM site_settings WHERE key = 'address'), ''),
        'business_hours', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'day', day_of_week,
                    'start_time', start_time,
                    'end_time', end_time,
                    'is_active', is_active
                )
            )
            FROM business_hours
            WHERE is_active = true
        ),
        'property_types', (
            SELECT array_agg(DISTINCT property_type)
            FROM properties
            WHERE status = 'active'
        ),
        'cities', (
            SELECT array_agg(DISTINCT city)
            FROM properties
            WHERE status = 'active'
        )
    );
$$;

-- Create function to search properties for AI
CREATE OR REPLACE FUNCTION public.search_properties_for_ai(
    property_type_filter TEXT DEFAULT NULL,
    city_filter TEXT DEFAULT NULL,
    min_price_filter NUMERIC DEFAULT NULL,
    max_price_filter NUMERIC DEFAULT NULL,
    min_bedrooms_filter INTEGER DEFAULT NULL,
    max_bedrooms_filter INTEGER DEFAULT NULL,
    limit_count INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'property_type', property_type,
            'city', city,
            'location', location,
            'price', price,
            'bedrooms', bedrooms,
            'bathrooms', bathrooms,
            'area', area,
            'features', features,
            'images', CASE WHEN array_length(images, 1) > 0 THEN images[1:3] ELSE '{}' END,
            'slug', slug,
            'property_code', property_code
        )
    )
    FROM (
        SELECT *
        FROM properties
        WHERE status = 'active'
            AND (property_type_filter IS NULL OR property_type ILIKE '%' || property_type_filter || '%')
            AND (city_filter IS NULL OR city ILIKE '%' || city_filter || '%')
            AND (min_price_filter IS NULL OR price >= min_price_filter)
            AND (max_price_filter IS NULL OR price <= max_price_filter)
            AND (min_bedrooms_filter IS NULL OR bedrooms >= min_bedrooms_filter)
            AND (max_bedrooms_filter IS NULL OR bedrooms <= max_bedrooms_filter)
        ORDER BY created_at DESC
        LIMIT limit_count
    ) subquery;
$$;