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

    const { data } = await supabase
        .from('user_settings')
        .select('gemini_api_key, openai_api_key, groq_api_key, selected_provider')
        .eq('user_id', user.id)
        .single()

    return {
        hasGeminiKey: !!data?.gemini_api_key,
        hasOpenAIKey: !!data?.openai_api_key,
        hasGroqKey: !!data?.groq_api_key,
        selectedProvider: data?.selected_provider || 'gemini'
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
            // Using gemini-1.5-flash as verified in lib/gemini/service.ts
            // If this fails, user might have an old key or restriction, but this is the correct model ID.
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
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
