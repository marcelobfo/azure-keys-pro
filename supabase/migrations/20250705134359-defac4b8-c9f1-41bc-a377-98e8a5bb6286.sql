-- Create analytics tables
CREATE TABLE public.analytics_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id UUID,
    session_id TEXT,
    page_path TEXT,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics summary table for performance metrics
CREATE TABLE public.analytics_summary (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    property_views INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    favorites_added INTEGER DEFAULT 0,
    visits_scheduled INTEGER DEFAULT 0,
    chat_messages INTEGER DEFAULT 0,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(date)
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics_events
CREATE POLICY "Admins can view analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Anyone can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

-- Create policies for analytics_summary
CREATE POLICY "Admins can view analytics summary" 
ON public.analytics_summary 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create function to update analytics summary
CREATE OR REPLACE FUNCTION public.update_analytics_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    event_date DATE := DATE(NEW.created_at);
BEGIN
    -- Update or insert summary for the date
    INSERT INTO public.analytics_summary (date, page_views, unique_visitors, property_views, leads_generated, favorites_added, visits_scheduled, chat_messages)
    VALUES (
        event_date,
        CASE WHEN NEW.event_type = 'page_view' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'unique_visitor' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'property_view' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'lead_created' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'favorite_added' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'visit_scheduled' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'chat_message' THEN 1 ELSE 0 END
    )
    ON CONFLICT (date) DO UPDATE SET
        page_views = analytics_summary.page_views + CASE WHEN NEW.event_type = 'page_view' THEN 1 ELSE 0 END,
        unique_visitors = analytics_summary.unique_visitors + CASE WHEN NEW.event_type = 'unique_visitor' THEN 1 ELSE 0 END,
        property_views = analytics_summary.property_views + CASE WHEN NEW.event_type = 'property_view' THEN 1 ELSE 0 END,
        leads_generated = analytics_summary.leads_generated + CASE WHEN NEW.event_type = 'lead_created' THEN 1 ELSE 0 END,
        favorites_added = analytics_summary.favorites_added + CASE WHEN NEW.event_type = 'favorite_added' THEN 1 ELSE 0 END,
        visits_scheduled = analytics_summary.visits_scheduled + CASE WHEN NEW.event_type = 'visit_scheduled' THEN 1 ELSE 0 END,
        chat_messages = analytics_summary.chat_messages + CASE WHEN NEW.event_type = 'chat_message' THEN 1 ELSE 0 END,
        updated_at = now();
    
    RETURN NEW;
END;
$$;

-- Create trigger for analytics summary updates
CREATE TRIGGER update_analytics_summary_trigger
    AFTER INSERT ON public.analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_analytics_summary();