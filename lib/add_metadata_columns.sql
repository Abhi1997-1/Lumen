-- Add metadata columns to meetings table
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS participants TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing';

-- Comment on columns
COMMENT ON COLUMN meetings.duration IS 'Duration of the audio in seconds';
COMMENT ON COLUMN meetings.participants IS 'List of identified speakers';
COMMENT ON COLUMN meetings.status IS 'Current status: processing, completed, failed';
