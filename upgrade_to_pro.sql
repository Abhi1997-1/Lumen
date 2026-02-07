-- Replace 'YOUR_USER_ID' with your actual User ID from Supabase Auth
-- You can find your User ID in the Supabase Dashboard -> Authentication -> Users

-- 1. Get your User ID from the dashboard or by running:
-- SELECT id, email FROM auth.users;

-- 2. Update the user_settings table
UPDATE public.user_settings
SET 
  tier = 'pro',
  credits_remaining = 1200, -- Give default Pro credits
  credits_reset_at = NOW() + INTERVAL '1 month'
WHERE user_id = 'YOUR_USER_ID_HERE'; -- <--- PASTE YOUR ID HERE

-- Verify the update
SELECT * FROM public.user_settings WHERE user_id = 'YOUR_USER_ID_HERE';
