-- Admin Dashboard Schema Updates

-- 1. Add is_admin column to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Create function to make a user an admin (by email)
-- This is useful to run from SQL editor
CREATE OR REPLACE FUNCTION make_admin(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user ID from auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NOT NULL THEN
    UPDATE user_settings SET is_admin = true WHERE user_id = target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS Policies for Admin Access (Optional but good practice)
-- Allow admins to view all settings? 
-- For now, we will rely on Service Role in Server Actions for admin features
-- to avoid complex RLS policies that might leak data.
-- The "is_admin" flag itself is readable by the user (own settings), which is fine.
