-- Check if specific user is admin
SELECT email, id FROM auth.users WHERE email = 'andyrathod1992@gmail.com';

-- Check their settings
SELECT * FROM user_settings 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'andyrathod1992@gmail.com');

-- Force Make Admin (Safe to run multiple times)
UPDATE user_settings 
SET is_admin = true 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'andyrathod1992@gmail.com');
