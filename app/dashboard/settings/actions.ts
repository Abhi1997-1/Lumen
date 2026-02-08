'use server'

import { createClient } from "@/lib/supabase/server"
import { encrypt, decryptText } from "@/lib/encryption"
import { revalidatePath } from "next/cache"

export async function getSettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            hasGeminiKey: false,
            hasOpenAIKey: false,
            hasGroqKey: false,
            selectedProvider: 'gemini'
        }
    }

    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('gemini_api_key, openai_api_key, groq_api_key, selected_provider, is_admin, tier')
            .eq('user_id', user.id)
            .single()

        if (error) throw error

        return {
            hasGeminiKey: !!data?.gemini_api_key,
            hasOpenAIKey: !!data?.openai_api_key,
            hasGroqKey: !!data?.groq_api_key,
            selectedProvider: data?.selected_provider || 'gemini',
            isAdmin: !!data?.is_admin,
            tier: data?.tier || 'free'
        }
    } catch (error) {
        console.error("Error fetching user settings:", error)
        return {
            hasGeminiKey: false,
            hasOpenAIKey: false,
            hasGroqKey: false,
            selectedProvider: 'gemini',
            isAdmin: false,
            tier: 'free'
        }
    }
}

export async function saveSettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Not authenticated")
    }

    const updates: any = {
        updated_at: new Date().toISOString()
    }

    const geminiKey = formData.get('gemini_api_key') as string
    if (geminiKey) updates.gemini_api_key = encrypt(geminiKey)

    const openaiKey = formData.get('openai_api_key') as string
    if (openaiKey) updates.openai_api_key = encrypt(openaiKey)

    const groqKey = formData.get('groq_api_key') as string
    if (groqKey) updates.groq_api_key = encrypt(groqKey)

    const selectedProvider = formData.get('selected_provider') as string
    if (selectedProvider) updates.selected_provider = selectedProvider

    const { error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            ...updates
        })

    if (error) throw error
    revalidatePath('/settings')
    revalidatePath('/dashboard')
}

export async function testConnection(provider: string, apiKeyInput?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    let apiKey = apiKeyInput ? apiKeyInput.trim() : ''
    let source = apiKeyInput ? 'provided' : ''

    // If no input provided, try to load from DB
    if (!apiKey) {
        const { data: settings } = await supabase
            .from('user_settings')
            .select('gemini_api_key, groq_api_key, openai_api_key')
            .eq('user_id', user.id)
            .single()



        if (provider === 'gemini' && settings?.gemini_api_key) {
            apiKey = decryptText(settings.gemini_api_key)
            source = 'personal'
        } else if (provider === 'groq' && settings?.groq_api_key) {
            apiKey = decryptText(settings.groq_api_key)
            source = 'personal'
        } else if (provider === 'openai' && settings?.openai_api_key) {
            apiKey = decryptText(settings.openai_api_key)
            source = 'personal'
        }
    }

    // Checking system env for Gemini only as fallback
    if (!apiKey && provider === 'gemini') {
        apiKey = process.env.GEMINI_API_KEY || ''
        source = 'system'
    }

    if (!apiKey) {
        return { success: false, error: "No API Key found to test." }
    }

    try {
        if (provider === 'gemini') {
            const { GoogleGenerativeAI } = await import("@google/generative-ai")
            const genAI = new GoogleGenerativeAI(apiKey)
            // Using gemini-2.0-flash-exp (Gemini 1.5 models retired April 2025)
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
            await model.generateContent("Reply with 'OK'")
        } else if (provider === 'groq') {
            const { Groq } = await import("groq-sdk")
            const groq = new Groq({ apiKey })
            await groq.chat.completions.create({
                messages: [{ role: "user", content: "Ping" }],
                model: "llama-3.3-70b-versatile",
            })
        } else if (provider === 'openai') {
            const OpenAI = (await import("openai")).default
            const openai = new OpenAI({ apiKey })
            await openai.models.list()
        } else {
            return { success: false, error: "Unknown provider" }
        }

        return { success: true, source }
    } catch (error: any) {
        console.error(`Test ${provider} connection failed:`, error)
        return { success: false, error: error.message || "Invalid API Key" }
    }
}

export async function syncSubscriptionStatus() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    // 1. Check for recent Pro subscription transactions (heuristic)
    const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .ilike('description', '%Pro%')
        .order('created_at', { ascending: false })
        .limit(1)

    // 2. If found, ensure tier is 'pro'
    if (transactions && transactions.length > 0) {
        const { error } = await supabase
            .from('user_settings')
            .update({ tier: 'pro' })
            .eq('user_id', user.id)

        if (error) return { success: false, error: error.message }
        revalidatePath('/dashboard')
        return { success: true, message: "Restored Pro status based on transaction history." }
    }

    // 3. Fallback: Check if they ALREADY have Pro in DB but UI is stale (revalidate)
    const { data: settings } = await supabase
        .from('user_settings')
        .select('tier')
        .eq('user_id', user.id)
        .single()

    if (settings?.tier === 'pro') {
        revalidatePath('/dashboard')
        return { success: true, message: "Status synchronized." }
    }

    return { success: false, error: "No active Pro subscription found." }
}

