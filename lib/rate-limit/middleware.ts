import { createClient } from '@/lib/supabase/server'

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: Date
    errorMessage?: string
    upgradePrompt?: boolean
}

export async function checkRateLimit(
    userId: string,
    provider: 'gemini' | 'openai' | 'groq'
): Promise<RateLimitResult> {
    const supabase = await createClient()

    // Get user's rate limits
    const { data: limits, error } = await supabase
        .from('user_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error || !limits) {
        // If no limits found, create default ones
        await supabase.from('user_rate_limits').insert({
            user_id: userId,
            tier: 'free'
        })

        return {
            allowed: true,
            remaining: 100,
            resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
    }

    const now = new Date()

    // Check minute-level rate limit
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    const { count: minuteCount } = await supabase
        .from('api_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('provider', provider)
        .gte('created_at', oneMinuteAgo.toISOString())

    const rpmLimit = limits[`${provider}_rpm`] || 10

    if ((minuteCount || 0) >= rpmLimit) {
        const resetAt = new Date(now.getTime() + 60 * 1000)
        return {
            allowed: false,
            remaining: 0,
            resetAt,
            errorMessage: `Rate limit exceeded: ${rpmLimit} requests per minute. Please wait.`,
            upgradePrompt: limits.tier === 'free'
        }
    }

    // Check daily rate limit
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const { count: dailyCount } = await supabase
        .from('api_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('provider', provider)
        .gte('created_at', startOfDay.toISOString())

    const rpdLimit = limits[`${provider}_rpd`] || 100

    if ((dailyCount || 0) >= rpdLimit) {
        const tomorrow = new Date(startOfDay)
        tomorrow.setDate(tomorrow.getDate() + 1)

        return {
            allowed: false,
            remaining: 0,
            resetAt: tomorrow,
            errorMessage: `Daily limit exceeded: ${rpdLimit} requests per day. Resets at midnight.`,
            upgradePrompt: limits.tier === 'free'
        }
    }

    const remaining = rpdLimit - (dailyCount || 0)
    const resetAt = new Date(startOfDay)
    resetAt.setDate(resetAt.getDate() + 1)

    return {
        allowed: true,
        remaining,
        resetAt
    }
}

export async function trackAPIUsage(
    userId: string,
    provider: 'gemini' | 'openai' | 'groq',
    data: {
        endpoint?: string
        tokensUsed?: number
        success: boolean
        errorCode?: string
        errorMessage?: string
    }
) {
    const supabase = await createClient()

    const { error } = await supabase.from('api_usage').insert({
        user_id: userId,
        provider,
        endpoint: data.endpoint,
        tokens_used: data.tokensUsed || 0,
        request_count: 1,
        success: data.success,
        error_code: data.errorCode,
        error_message: data.errorMessage
    })

    if (error) {
        console.error('Failed to track API usage:', error)
    }
}

export async function getUserUsageStats(userId: string) {
    const supabase = await createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get limits
    const { data: limits } = await supabase
        .from('user_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (!limits) {
        return null
    }

    // Get today's usage for each provider
    const providers: Array<'gemini' | 'openai' | 'groq'> = ['gemini', 'openai', 'groq']
    const usage: Record<string, any> = {}

    for (const provider of providers) {
        const { count } = await supabase
            .from('api_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('provider', provider)
            .gte('created_at', today.toISOString())

        usage[provider] = {
            today: count || 0,
            dailyLimit: limits[`${provider}_rpd`],
            remaining: (limits[`${provider}_rpd`] || 0) - (count || 0)
        }
    }

    return {
        tier: limits.tier,
        usage,
        creditsUsed: limits.credits_used,
        monthlyCredits: limits.monthly_credits
    }
}
