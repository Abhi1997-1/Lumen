-- RUN THIS IN SUPABASE SQL EDITOR TO FIX INTERNAL SERVER ERROR

-- The 'meetings' and 'user_settings' tables have strict links to real users (auth.users).
-- Since we are using a fake "Dev User", we need to remove these links for development.

-- 1. Remove FK from meetings table
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_user_id_fkey;

-- 2. Remove FK from user_settings table
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

-- 3. (Optional) Make user_id nullable just in case, though our code provides a UUID
ALTER TABLE meetings ALTER COLUMN user_id DROP NOT NULL;

-- 4. Remove FK from notes table
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;
