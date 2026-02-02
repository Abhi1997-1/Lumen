-- Add video_url column to meetings table
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add status column if it doesn't exist (defaulting to 'completed' for existing)
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Allow RLS to update these columns
-- (Existing policies might already cover update if "Users can manage their own meetings" is ALL)
