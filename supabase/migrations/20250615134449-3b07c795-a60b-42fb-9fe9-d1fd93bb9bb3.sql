
-- Adiciona campo Tour Virtual e Vídeo em imóveis
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS video_url TEXT;
