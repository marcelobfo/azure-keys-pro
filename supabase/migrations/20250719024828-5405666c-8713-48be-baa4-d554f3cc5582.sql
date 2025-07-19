-- Add tags and notes columns to chat_sessions table
ALTER TABLE public.chat_sessions 
ADD COLUMN tags text[] DEFAULT '{}',
ADD COLUMN notes text;