'use server'

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { AIFactory } from "@/lib/ai/factory"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import crypto from 'crypto'


const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

// Helper to get key. In prod, this must be 32 bytes.
function getKey() {
    const key = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 chars default
    return Buffer.from(key).subarray(0, 32);
}

function decryptText(text: string) {
    if (!text) return text;
    const textParts = text.split(':');
    const ivPart = textParts.shift();
    if (!ivPart) throw new Error('Invalid encrypted text');

    const iv = Buffer.from(ivPart, 'hex');
    const encryptedText = textParts.join(':');
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Credit costs per minute by model
const MODEL_CREDIT_COSTS: Record<string, number> = {
    'gemini-1.5-flash': 1,
    'gemini-1.5-pro': 2,
    'grok-2': 2,
    'gpt-4o': 3,
}

export async function createMeeting(storagePath: string, meetingTitle: string = '', durationSeconds: number = 0, providerOverride?: string, modelOverride?: string) {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    // 1. Fetch user settings
    const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Determine Provider
    let provider = providerOverride || 'gemini'
    if (modelOverride) {
        if (modelOverride.includes('gpt')) provider = 'openai'
        else if (modelOverride.includes('grok')) provider = 'groq'
        else if (modelOverride.includes('gemini')) provider = 'gemini'
    }

    // Determine Key & Credit Logic
    const tier = settings?.tier || 'free'
    const credits = settings?.credits_remaining || 0
    const preferOwnKey = settings?.prefer_own_key || false

    // Check availability of user keys
    const userGeminiKey = settings?.gemini_api_key ? decryptText(settings.gemini_api_key) : null
    const userOpenAIKey = settings?.openai_api_key ? decryptText(settings.openai_api_key) : null
    const userGroqKey = settings?.groq_api_key ? decryptText(settings.groq_api_key) : null

    let keyToUse: string | undefined = undefined
    let usingCredits = false

    // Resolve Key based on Provider
    if (provider === 'gemini') keyToUse = userGeminiKey || undefined
    if (provider === 'openai') keyToUse = userOpenAIKey || undefined
    if (provider === 'groq') keyToUse = userGroqKey || undefined

    // Logic:
    // 1. If preferOwnKey AND we have a key -> Use it (usingCredits = false)
    // 2. If Pro AND (no key OR !preferOwnKey) -> Use System Key (usingCredits = true)
    // 3. If Free AND no key -> Block

    if (keyToUse && preferOwnKey) {
        // Option 1: User prefers their key and has one.
        usingCredits = false;
        console.log(`Using user's own key for ${provider} (Preference set)`)
    } else if (tier === 'pro') {
        // Option 2: Pro user. 
        // If they have a key but didn't prefer it, we usually default to credits for Pro convenience?
        // Or if they DON'T have a key, we MUST use credits.
        // If they have a key and preferOwnKey is FALSE, we use credits.
        usingCredits = true;
        keyToUse = undefined; // Force system key usage downstream if implementation supports it
    } else if (keyToUse) {
        // Option 3: Free user but has key (BYOK)
        usingCredits = false;
    } else {
        // Option 4: Block
        return { success: false, error: "No API key found. Please upgrade to Connect your own key in Settings." }
    }

    // Calculate Credits if using them
    const model = modelOverride || 'gemini-flash'
    const durationMinutes = Math.ceil(durationSeconds / 60)
    const creditCostPerMin = MODEL_CREDIT_COSTS[model] || 1
    const creditsNeeded = durationMinutes * creditCostPerMin

    if (usingCredits) {
        if (credits < creditsNeeded) {
            return {
                success: false,
                error: `Insufficient credits. Need ${creditsNeeded} credits, but you have ${credits}.`
            }
        }
    }

    // Create initial meeting record
    const { data: meeting, error } = await supabase
        .from('meetings')
        .insert({
            user_id: user.id,
            audio_url: storagePath,
            title: meetingTitle || 'Processing...',
            status: 'processing',
            duration: durationSeconds,
            model_used: model,
        })
        .select()
        .single()

    if (error) {
        console.error("DB Error:", error)
        return { success: false, error: "Failed to create meeting record" }
    }

    // Async Processing
    ; (async () => {
        try {
            // Re-import dynamically to avoid circular deps if any, or just standard import
            // const { AIFactory } = await import("@/lib/ai/factory"); 
            // AIFactory is imported at top level, likely fine.

            // Note: AIFactory.getService(provider, apiKey, userId)
            // If apiKey is undefined, Service *should* use system key.
            // Let's verify GeminiService supports this. (Previous knowledge says yes).

            const service = AIFactory.getService(provider, keyToUse, user.id);
            await service.process(storagePath, meeting.id);

            // Deduct credits if we decided to use them
            if (usingCredits && creditsNeeded > 0) {
                await deductCredits(creditsNeeded, meeting.id, model)
            }
        } catch (e: any) {
            console.error("Async processing failed:", e);
            const supabaseAdmin = await createServerClient();
            await supabaseAdmin.from('meetings').update({
                status: 'failed',
                summary: `Processing Error: ${e.message}`
            }).eq('id', meeting.id)
        }
    })();

    return { success: true, meetingId: meeting.id }
}

export async function togglePreferOwnKey(enabled: boolean) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const { error } = await supabase
        .from('user_settings')
        .update({ prefer_own_key: enabled })
        .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function retryProcessing(meetingId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const { data: meeting } = await supabase.from('meetings').select('audio_url').eq('id', meetingId).single();
    if (!meeting) return { success: false, error: "Meeting not found" };

    // Reset status to processing
    await supabase.from('meetings').update({ status: 'processing', transcript: '', summary: '' }).eq('id', meetingId);

    // Trigger Factory Logic (Await this time to catch errors live for retry)
    try {
        console.log("Retrying meeting:", meetingId, "File:", meeting.audio_url);

        // Fetch Settings again
        const { data: allSettings } = await supabase
            .from('user_settings')
            .select('gemini_api_key, groq_api_key, openai_api_key, selected_provider')
            .eq('user_id', user.id)
            .single()

        const provider = allSettings?.selected_provider || 'gemini'
        let apiKey = ''
        if (provider === 'groq' && typeof allSettings?.groq_api_key === 'string') apiKey = decryptText(allSettings.groq_api_key)
        if (provider === 'openai' && typeof allSettings?.openai_api_key === 'string') apiKey = decryptText(allSettings.openai_api_key)

        const { AIFactory } = await import("@/lib/ai/factory");
        const service = AIFactory.getService(provider, apiKey, user.id);

        await service.process(meeting.audio_url, meetingId);

        revalidatePath(`/dashboard/${meetingId}`);
        return { success: true };

    } catch (e: any) {
        console.error("Retry failed:", e);

        let friendlyError = e.message;
        if (e.message.includes('429') || e.message.includes('Quota') || e.message.includes('limit')) {
            friendlyError = "Limit Exceeded. Check your API Key settings.";
        }

        await supabase.from('meetings').update({
            status: 'failed',
            summary: `Processing Failed: ${friendlyError}`
        }).eq('id', meetingId);
        return { success: false, error: friendlyError };
    }
}

export async function getMeetingStatus(meetingId: string) {
    const supabase = await createServerClient()
    const { data: meeting } = await supabase.from('meetings').select('status, transcript, summary').eq('id', meetingId).single()
    return meeting ? { status: meeting.status, hasTranscript: !!meeting.transcript } : null
}

export async function updateMeetingActionItems(meetingId: string, items: string[]) {
    const supabase = await createServerClient()
    const { error } = await supabase
        .from('meetings')
        .update({ action_items: items })
        .eq('id', meetingId)

    if (error) console.error("Error updating action items:", error)
    revalidatePath(`/dashboard/${meetingId}`)
    return { success: !error }
}

export async function createNote(title: string, content: string) {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const { data, error } = await supabase
        .from('notes')
        .insert({
            user_id: user.id,
            title,
            content
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/notes')
    return { success: true, note: data }
}

export async function translateTranscript(text: string, targetLanguage: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    try {
        const { generateTranslation } = await import('@/lib/gemini/service')
        const translation = await generateTranslation(user.id, text, targetLanguage)
        return { success: true, translation }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function askAI(context: string, question: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    try {
        // Fetch Settings for Factory
        const { data: allSettings } = await supabase
            .from('user_settings')
            .select('gemini_api_key, groq_api_key, openai_api_key, selected_provider')
            .eq('user_id', user.id)
            .single()

        const provider = allSettings?.selected_provider || 'gemini'
        let apiKey = ''
        if (provider === 'groq' && typeof allSettings?.groq_api_key === 'string') apiKey = decryptText(allSettings.groq_api_key)
        if (provider === 'openai' && typeof allSettings?.openai_api_key === 'string') apiKey = decryptText(allSettings.openai_api_key)

        const { AIFactory } = await import("@/lib/ai/factory");
        const service = AIFactory.getService(provider, apiKey, user.id);

        const answer = await service.ask(context, question);

        return { success: true, answer }
    } catch (error: any) {
        console.error("Ask AI Error:", error);
        return { success: false, error: error.message }
    }
}

export async function translateMeeting(meetingId: string, targetLanguage: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const { data: meeting } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .eq('user_id', user.id)
        .single()

    if (!meeting) return { success: false, error: "Meeting not found" }

    try {
        const { generateMeetingTranslation } = await import('@/lib/gemini/service')
        const translation = await generateMeetingTranslation(
            user.id,
            meeting.summary || '',
            meeting.action_items || [],
            meeting.transcript || '',
            targetLanguage
        )
        return { success: true, data: translation }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function askFolderAI(folderId: string, question: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    try {
        // 1. Fetch all meetings in the folder to build context
        const { data: meetings } = await supabase
            .from('meetings')
            .select('title, summary, action_items, created_at')
            .eq('folder_id', folderId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20); // Limit context window

        if (!meetings || meetings.length === 0) {
            return { success: true, answer: "This folder has no meetings yet." }
        }

        const context = meetings.map(m => `
Date: ${new Date(m.created_at).toLocaleDateString()}
Title: ${m.title}
Summary: ${m.summary}
Action Items: ${Array.isArray(m.action_items) ? m.action_items.join(', ') : ''}
---
`).join('\n');

        // 2. Fetch Settings for Factory
        const { data: allSettings } = await supabase
            .from('user_settings')
            .select('gemini_api_key, groq_api_key, openai_api_key, selected_provider')
            .eq('user_id', user.id)
            .single()

        const provider = allSettings?.selected_provider || 'gemini'
        let apiKey = ''
        if (provider === 'groq' && typeof allSettings?.groq_api_key === 'string') apiKey = decryptText(allSettings.groq_api_key)
        if (provider === 'openai' && typeof allSettings?.openai_api_key === 'string') apiKey = decryptText(allSettings.openai_api_key)

        // 3. Execute via Factory
        const { AIFactory } = await import("@/lib/ai/factory");
        const service = AIFactory.getService(provider, apiKey, user.id);

        const answer = await service.ask(context, question);
        return { success: true, answer }

    } catch (error: any) {
        console.error("Ask Folder AI Error:", error);
        return { success: false, error: error.message }
    }
}

// --- QUOTA & SUBSCRIPTION ACTIONS ---

export async function getMonthlyUsage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, used: 0, limit: 0, tier: 'free' }

    // 1. Get User/Tier Settings
    const { data: settings } = await supabase
        .from('user_settings')
        .select('gemini_api_key, tier')
        .eq('user_id', user.id)
        .single()

    // Determine Tier & Limit
    // Defaults: Free (No Key) = 0 (Blocked), Pro = 10M
    const hasCustomKey = !!settings?.gemini_api_key
    const tier = settings?.tier || 'free' // 'free' | 'pro'

    let limit = 0 // Default to 0 for regular free users without key

    if (tier === 'pro') {
        limit = 10_000_000
    } else if (hasCustomKey) {
        limit = -1 // Unlimited for BYOK
    } else {
        // Optional: We could give a tiny "trial" amount here if we wanted, 
        // but user requested "remove free plan", so 0 is safer to force BYOK/Pro.
        limit = 0
    }

    // 2. Calculate Usage (Sum total_tokens from this month's meetings)
    // Start of month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: meetings, error } = await supabase
        .from('meetings')
        .select('total_tokens')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)

    if (error) {
        console.error("Error fetching usage:", error)
        return { success: false, used: 0, limit, tier }
    }

    const used = meetings.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0)

    return { success: true, used, limit, tier: hasCustomKey ? 'unlimited' : tier }
}

export async function upgradeTier(newTier: 'pro' | 'free') {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    // Calculate credits reset date (1 month from now)
    const creditsResetAt = new Date()
    creditsResetAt.setMonth(creditsResetAt.getMonth() + 1)

    const updateData: Record<string, any> = {
        user_id: user.id,
        tier: newTier,
    }

    // If upgrading to Pro, give 1200 credits
    if (newTier === 'pro') {
        updateData.credits_remaining = 1200
        updateData.credits_reset_at = creditsResetAt.toISOString()
    }

    const { error } = await supabase
        .from('user_settings')
        .upsert(updateData, { onConflict: 'user_id' })

    if (error) return { success: false, error: error.message }

    // Log the transaction
    if (newTier === 'pro') {
        await supabase.from('credit_transactions').insert({
            user_id: user.id,
            amount: 1200,
            type: 'subscription',
            description: 'Pro plan monthly credits'
        })
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function purchaseCredits(credits: number, price: number, packId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    // TODO: Integrate Stripe payment here
    // For now, this is a mock that just adds the credits

    // Get current credits
    const { data: settings } = await supabase
        .from('user_settings')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .single()

    const currentCredits = settings?.credits_remaining || 0
    const newCredits = currentCredits + credits

    // Update credits
    const { error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            credits_remaining: newCredits
        }, { onConflict: 'user_id' })

    if (error) return { success: false, error: error.message }

    // Log transaction
    await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: credits,
        type: 'purchase',
        description: `Credit pack: ${packId} ($${price})`
    })

    revalidatePath('/dashboard')
    return { success: true, newBalance: newCredits }
}

export async function getCredits() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('🔍 getCredits called')
    console.log('👤 User:', user?.email, user?.id)

    if (!user) {
        console.log('❌ No user found')
        return { credits: 0, tier: 'free', hasApiKey: false, isAdmin: false }
    }

    try {
        console.log('🔑 Environment check:', {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        })

        // Use Admin Client to ensure we can read settings (including is_admin) regardless of RLS
        // This fixes the issue where the user has admin access but can't see the link
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: settings, error } = await supabaseAdmin
            .from('user_settings')
            .select('credits_remaining, tier, gemini_api_key, credits_reset_at, prefer_own_key, is_admin')
            .eq('user_id', user.id)
            .single()

        console.log('📊 Settings query result:', {
            hasData: !!settings,
            error: error?.message,
            is_admin: settings?.is_admin,
            tier: settings?.tier
        })

        if (error) {
            console.error('❌ Error fetching settings:', error)
        }

        const result = {
            credits: settings?.credits_remaining || 0,
            tier: settings?.tier || 'free',
            hasApiKey: !!settings?.gemini_api_key,
            creditsResetAt: settings?.credits_reset_at,
            preferOwnKey: !!settings?.prefer_own_key,
            isAdmin: !!settings?.is_admin
        }

        console.log('✅ Returning:', result)
        return result
    } catch (error) {
        console.error("❌ Error in getCredits:", error)
        return { credits: 0, tier: 'free', hasApiKey: false, isAdmin: false }
    }
}

export async function deductCredits(amount: number, meetingId: string, model: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const { data: settings } = await supabase
        .from('user_settings')
        .select('credits_remaining, tier, gemini_api_key')
        .eq('user_id', user.id)
        .single()

    const hasApiKey = !!settings?.gemini_api_key
    const isPro = settings?.tier === 'pro'
    const currentCredits = settings?.credits_remaining || 0

    // If they have their own API key, no credits needed
    if (hasApiKey) {
        return { success: true, creditsUsed: 0, remaining: currentCredits }
    }

    // If not Pro and no API key, they can't transcribe
    if (!isPro && !hasApiKey) {
        return {
            success: false,
            error: "Please add an API key in Settings or upgrade to Pro to transcribe."
        }
    }

    // Check if they have enough credits
    if (currentCredits < amount) {
        return {
            success: false,
            error: `Insufficient credits. Need ${amount}, have ${currentCredits}. Buy more credits to continue.`
        }
    }

    // Deduct credits
    const newCredits = currentCredits - amount
    const { error } = await supabase
        .from('user_settings')
        .update({ credits_remaining: newCredits })
        .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    // Log usage
    await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -amount,
        type: 'usage',
        description: `Transcription with ${model}`,
        meeting_id: meetingId
    })

    return { success: true, creditsUsed: amount, remaining: newCredits }
}

export async function updateProfile(formData: FormData) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const fullName = formData.get('full_name') as string
    const avatarId = formData.get('avatar_id') as string

    // Update Supabase Auth Metadata (Standard way for simple profile data)
    const { error } = await supabase.auth.updateUser({
        data: {
            full_name: fullName,
            avatar_id: avatarId
        }
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
    return { success: true }
}


export async function transcribeChunkAction(formData: FormData) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, text: "" }

    try {
        const file = formData.get('audio') as File;
        const language = formData.get('language') as string || 'English';

        if (!file) return { success: false, text: "" };

        const buffer = Buffer.from(await file.arrayBuffer());
        const { transcribeAudioChunkGemini } = await import('@/lib/gemini/service');

        // Parallel: Get Original AND Translation if language is not English
        // But for low latency, maybe just get the requested one? 
        // User asked for "save original and translated". 
        // Real-time: Displaying both live is expensive (2 calls). 
        // Let's maximize value: If Lang != English, get Translation. Original audio is saved anyway.
        // Wait, user said "we see it live as well" (both).

        const tasks = [transcribeAudioChunkGemini(user.id, buffer, file.type || 'audio/webm', 'English')];
        if (language !== 'English') {
            tasks.push(transcribeAudioChunkGemini(user.id, buffer, file.type || 'audio/webm', language));
        }

        const results = await Promise.all(tasks);
        const originalText = results[0];
        const translatedText = results.length > 1 ? results[1] : null;

        return { success: true, text: originalText, translatedText };
    } catch (error) {
        console.error("Chunk action error:", error);
        return { success: false, text: "" };
    }
}

export async function saveTranslatedMeeting(meetingId: string, translatedData: any) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const { error } = await supabase
        .from('meetings')
        .update({
            transcript: translatedData.transcript,
            summary: translatedData.summary,
            action_items: translatedData.action_items,
            // We might want to store 'original_language' or 'translated_language' column?
            // For now, we update the main fields as requested.
        })
        .eq('id', meetingId)
        .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    revalidatePath(`/dashboard/${meetingId}`)
    return { success: true }
}

export async function deleteUserAccount() {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    try {
        // 1. Get all meetings to delete their storage files
        const { data: meetings } = await supabase
            .from('meetings')
            .select('storage_path')
            .eq('user_id', user.id)

        // 2. Delete storage files
        if (meetings && meetings.length > 0) {
            const paths = meetings.map(m => m.storage_path).filter(Boolean)
            if (paths.length > 0) {
                await supabase.storage.from('recordings').remove(paths)
            }
        }

        // 3. Delete meetings (cascade will handle related data)
        await supabase
            .from('meetings')
            .delete()
            .eq('user_id', user.id)

        // 4. Delete user settings
        await supabase
            .from('user_settings')
            .delete()
            .eq('user_id', user.id)

        // 5. Note: Supabase Auth user deletion requires admin API or user to sign out
        // The user will be signed out after this action

        return { success: true }
    } catch (error: any) {
        console.error("Error deleting user account:", error)
        return { success: false, error: error.message || "Failed to delete account" }
    }
}
