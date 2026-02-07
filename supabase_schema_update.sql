-- ==================================================
-- SIMPLE MIGRATION: Add credits to existing tables
-- Just paste and run this in Supabase SQL Editor
-- ==================================================

-- Add credits columns to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS credits_remaining INT DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS avatar_id TEXT;

-- Add model tracking to meetings
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS model_used TEXT;

-- Create credit transactions table (for tracking purchases/usage)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount INT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  meeting_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new table
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for credit_transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON credit_transactions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
