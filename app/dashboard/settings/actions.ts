'use server'

import { createClient } from "@/lib/supabase/server"
import { encrypt } from "@/lib/crypto"
import { revalidatePath } from "next/cache"

export async function getSettings() {
    const supabase = await createClient()
    // Mock user for development
    const user = { id: '11111111-1111-1111-1111-111111111111' }

    const { data } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .eq('user_id', user.id)
        .single()

    if (data?.gemini_api_key) {
        return { hasKey: true }
    }
    return { hasKey: false }
}

export async function saveSettings(formData: FormData) {
    const supabase = await createClient()
    // Mock user for development
    const user = { id: '11111111-1111-1111-1111-111111111111' }

    const apiKey = formData.get('gemini_api_key') as string
    if (!apiKey) return

    const encryptedKey = encrypt(apiKey)

    const { error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            gemini_api_key: encryptedKey,
            updated_at: new Date().toISOString()
        })

    if (error) throw error
    revalidatePath('/settings')
    revalidatePath('/dashboard')
}

export async function testGeminiConnection(apiKeyInput?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    let apiKey = apiKeyInput ? apiKeyInput.trim() : ''
    let source = apiKeyInput ? 'provided' : ''

    // If no input provided, try to load from DB
    if (!apiKey) {
        const { data: settings } = await supabase
            .from('user_settings')
            .select('gemini_api_key')
            .eq('user_id', user.id)
            .single()

        if (settings?.gemini_api_key) {
            const { decrypt } = await import("@/lib/crypto") // Dynamic import to avoid cycles if any
            apiKey = decrypt(settings.gemini_api_key)
            source = 'personal'
        }
    }

    // If still no key, check system env
    if (!apiKey) {
        apiKey = process.env.GEMINI_API_KEY || ''
        source = 'system'
    }

    if (!apiKey) {
        return { success: false, error: "No API Key found to test." }
    }

    try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai")
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

        // Run a minimal generation to verify validity
        await model.generateContent("Reply with 'OK'")

        return { success: true, source }
    } catch (error: any) {
        console.error("Test connection failed:", error)
        return { success: false, error: error.message || "Invalid API Key" }
    }
}
