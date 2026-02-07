-- 1. Count users by Tier
SELECT tier, COUNT(*) as user_count 
FROM user_settings 
GROUP BY tier;

-- 2. List all Pro Users (with credits)
SELECT user_id, tier, credits_remaining, created_at 
FROM user_settings 
WHERE tier = 'pro';

-- 3. List Top Credit Holders
SELECT user_id, tier, credits_remaining 
FROM user_settings 
ORDER BY credits_remaining DESC 
LIMIT 10;
