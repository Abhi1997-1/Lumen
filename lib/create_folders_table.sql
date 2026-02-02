-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT 'bg-blue-500/10 text-blue-500',
    icon TEXT DEFAULT 'Folder',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own folders" ON folders
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow all access to folders for dev" ON folders FOR ALL USING (true) WITH CHECK (true);

-- Update notes table to link to folders
ALTER TABLE notes ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
