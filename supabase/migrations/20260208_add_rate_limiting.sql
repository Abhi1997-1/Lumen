-- API Usage Tracking and Rate Limiting System
-- This migration creates tables and functions to track API usage and enforce rate limits

-- 1. API Usage Tracking Table
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openai', 'groq')),
    endpoint TEXT,
    tokens_used INTEGER DEFAULT 0,
    request_count INTEGER DEFAULT 1,
    cost_credits DECIMAL(10, 2) DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_user_created ON api_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_provider ON api_usage(user_id, provider, created_at DESC);

-- 2. User Rate Limits Configuration Table
CREATE TABLE IF NOT EXISTS user_rate_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'admin')),
    
    -- Gemini limits
    gemini_rpm INTEGER DEFAULT 10,
    gemini_rpd INTEGER DEFAULT 100,
    
    -- OpenAI limits
    openai_rpm INTEGER DEFAULT 5,
    openai_rpd INTEGER DEFAULT 50,
    
    -- Groq limits
    groq_rpm INTEGER DEFAULT 20,
    groq_rpd INTEGER DEFAULT 200,
    
    -- Credit system
    monthly_credits INTEGER DEFAULT 100,
    credits_used INTEGER DEFAULT 0,
    credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Auto-create rate limits for new users
CREATE OR REPLACE FUNCTION create_user_rate_limits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_rate_limits (user_id, tier)
    VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_user_created_rate_limits ON auth.users;
CREATE TRIGGER on_user_created_rate_limits
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_rate_limits();

-- 4. Function to check and update tier based on user_settings
CREATE OR REPLACE FUNCTION sync_user_tier()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rate limits when user tier changes in user_settings
    IF NEW.tier IS DISTINCT FROM OLD.tier THEN
        UPDATE user_rate_limits
        SET 
            tier = NEW.tier,
            gemini_rpm = CASE NEW.tier
                WHEN 'pro' THEN 60
                WHEN 'admin' THEN 120
                ELSE 10
            END,
            gemini_rpd = CASE NEW.tier
                WHEN 'pro' THEN 1000
                WHEN 'admin' THEN 5000
                ELSE 100
            END,
            openai_rpm = CASE NEW.tier
                WHEN 'pro' THEN 30
                WHEN 'admin' THEN 60
                ELSE 5
            END,
            openai_rpd = CASE NEW.tier
                WHEN 'pro' THEN 500
                WHEN 'admin' THEN 2000
                ELSE 50
            END,
            monthly_credits = CASE NEW.tier
                WHEN 'pro' THEN 1000
                WHEN 'admin' THEN 999999
                ELSE 100
            END,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tier sync
DROP TRIGGER IF EXISTS on_tier_changed ON user_settings;
CREATE TRIGGER on_tier_changed
    AFTER UPDATE ON user_settings
    FOR EACH ROW
    WHEN (NEW.tier IS DISTINCT FROM OLD.tier)
    EXECUTE FUNCTION sync_user_tier();

-- 5. Backfill rate limits for existing users
INSERT INTO user_rate_limits (user_id, tier)
SELECT 
    u.id,
    COALESCE(us.tier, 'free')
FROM auth.users u
LEFT JOIN user_settings us ON us.user_id = u.id
ON CONFLICT (user_id) DO UPDATE
SET tier = EXCLUDED.tier;

-- 6. Enable Row Level Security
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for api_usage
CREATE POLICY "Users can view their own API usage"
    ON api_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert API usage"
    ON api_usage FOR INSERT
    WITH CHECK (true);

-- 8. RLS Policies for user_rate_limits
CREATE POLICY "Users can view their own rate limits"
    ON user_rate_limits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
    ON user_rate_limits FOR ALL
    USING (true);

-- 9. Helpful view for recent usage
CREATE OR REPLACE VIEW user_usage_summary AS
SELECT 
    user_id,
    provider,
    DATE(created_at) as usage_date,
    COUNT(*) as total_requests,
    SUM(tokens_used) as total_tokens,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_requests
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id, provider, DATE(created_at)
ORDER BY usage_date DESC;

-- Grant access to views
GRANT SELECT ON user_usage_summary TO authenticated;
