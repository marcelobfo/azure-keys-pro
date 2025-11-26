-- Add separate API key columns for Gemini and OpenAI
ALTER TABLE chat_configurations 
  ADD COLUMN IF NOT EXISTS gemini_api_key TEXT,
  ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

-- Migrate existing api_key_encrypted to the appropriate column based on api_provider
UPDATE chat_configurations 
SET gemini_api_key = api_key_encrypted 
WHERE api_provider = 'gemini' AND api_key_encrypted IS NOT NULL;

UPDATE chat_configurations 
SET openai_api_key = api_key_encrypted 
WHERE api_provider = 'openai' AND api_key_encrypted IS NOT NULL;