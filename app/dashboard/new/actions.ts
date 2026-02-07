'use server'

import { createClient } from "@/lib/supabase/server"

export async function getProviderStatus() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            providers: [],
            defaultProvider: 'gemini'
        }
    }

    const { data } = await supabase
        .from('user_settings')
        .select('gemini_api_key, openai_api_key, groq_api_key, selected_provider, tier, credits_remaining')
        .eq('user_id', user.id)
        .single()

    return {
        tier: data?.tier || 'free',
        credits: data?.credits_remaining || 0,
        providers: [
            { id: 'gemini', name: 'Gemini', connected: !!data?.gemini_api_key, description: 'Free & Fast' },
            { id: 'groq', name: 'Groq', connected: !!data?.groq_api_key, description: 'Lightning Fast' },
            { id: 'openai', name: 'OpenAI', connected: !!data?.openai_api_key, description: 'Premium Quality' }
        ],
        defaultProvider: data?.selected_provider || 'gemini'
    }
}
