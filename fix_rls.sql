-- Secure RLS Policies for user_settings and meetings

-- 1. Secure user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop insecure "Dev" policies if they exist (and any other loose policies)
DROP POLICY IF EXISTS "Dev: Public Access to Settings for ALL" ON user_settings;
DROP POLICY IF EXISTS "Public Access" ON user_settings;
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

-- Create strict policies
CREATE POLICY "Users can view own settings" 
ON user_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
ON user_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
ON user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. Secure meetings (just in case)
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dev: Public Access to Meetings for ALL" ON meetings;
DROP POLICY IF EXISTS "Users can view own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can insert own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete own meetings" ON meetings;

CREATE POLICY "Users can view own meetings" 
ON meetings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings" 
ON meetings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings" 
ON meetings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings" 
ON meetings FOR DELETE 
USING (auth.uid() = user_id);
