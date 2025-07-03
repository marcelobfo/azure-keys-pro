
-- Add system_instruction column to chat_configurations table
ALTER TABLE chat_configurations 
ADD COLUMN IF NOT EXISTS system_instruction TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN chat_configurations.system_instruction IS 'Custom system instruction for AI chat behavior';
