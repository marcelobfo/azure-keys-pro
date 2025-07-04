-- Create webhook_logs table for analytics
CREATE TABLE public.webhook_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id UUID,
    data JSONB,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook_logs
CREATE POLICY "Admins can view webhook logs" 
ON public.webhook_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add property view tracking
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create function to increment property views
CREATE OR REPLACE FUNCTION public.increment_property_views(property_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.properties 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = property_id;
$$;

-- Add external webhook URL setting
INSERT INTO public.site_settings (key, value) 
VALUES ('external_webhook_url', '') 
ON CONFLICT (key) DO NOTHING;