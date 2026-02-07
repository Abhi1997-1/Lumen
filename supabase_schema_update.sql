-- ==================================================
-- RUN THIS FIRST: Add missing columns for Credit System
-- ==================================================

-- 1. Add columns to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS credits_remaining INT DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free'; 
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS avatar_id TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS prefer_own_key BOOLEAN DEFAULT false;

-- 2. Add model tracking to meetings
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS model_used TEXT;

-- 3. Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount INT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  meeting_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Add Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
CREATE POLICY "Users can view own transactions" ON credit_transactions 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;
CREATE POLICY "Users can insert own transactions" ON credit_transactions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
