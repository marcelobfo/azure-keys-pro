-- Create business_hours table for managing business hours
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL, -- 0=domingo, 1=segunda, 2=terça, ..., 6=sábado
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Enable RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view business hours" 
ON public.business_hours 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage business hours" 
ON public.business_hours 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Insert default business hours (Monday to Friday, 8:00-18:00)
INSERT INTO public.business_hours (day_of_week, start_time, end_time, is_active) VALUES
(1, '08:00', '18:00', true),
(2, '08:00', '18:00', true),
(3, '08:00', '18:00', true),
(4, '08:00', '18:00', true),
(5, '08:00', '18:00', true),
(0, '09:00', '14:00', false),
(6, '09:00', '14:00', false)
ON CONFLICT (day_of_week) DO NOTHING;

-- Create function to check if current time is within business hours
CREATE OR REPLACE FUNCTION public.is_business_hours()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_hours
    WHERE day_of_week = EXTRACT(DOW FROM NOW())
      AND is_active = true
      AND TO_CHAR(NOW(), 'HH24:MI') BETWEEN start_time AND end_time
  );
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_business_hours_updated_at
  BEFORE UPDATE ON public.business_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();