-- Add token usage tracking columns to meetings table
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS input_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;

-- Comment on columns for clarity
COMMENT ON COLUMN meetings.input_tokens IS 'Number of tokens in the prompt/audio input';
COMMENT ON COLUMN meetings.output_tokens IS 'Number of tokens in the generated response';
COMMENT ON COLUMN meetings.total_tokens IS 'Total tokens consumed by this meeting processing';
