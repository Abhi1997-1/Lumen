-- Add columns for new AI providers
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS openai_api_key text,
ADD COLUMN IF NOT EXISTS groq_api_key text,
ADD COLUMN IF NOT EXISTS selected_provider text DEFAULT 'gemini';

-- Comment: Providers can be 'gemini', 'openai', 'groq'
