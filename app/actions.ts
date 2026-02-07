'use server'

import { createClient } from "@/lib/supabase/server"
import { AIFactory } from "@/lib/ai/factory"
import { decrypt as decryptString } from "@/lib/crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createMeeting(storagePath: string, meetingTitle: string = '', durationSeconds: number = 0) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    // Check Usage Limits
    // 1. Fetch user settings to see if they have a custom key
    const { data: settings } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .eq('user_id', user.id)
        .single()

    const hasCustomKey = !!settings?.gemini_api_key

    // 2. Enforce 20-minute limit for default plan
    // 1200 seconds = 20 minutes
    if (!hasCustomKey && durationSeconds > 1200) {
        return {
            success: false,
            error: "Free Plan Limit: Recordings over 20 minutes require your own Gemini API Key. Please add one in Settings."
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
            participants: [],
            transcript: '',
            summary: ''
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }

    // Trigger AI Processing (Fire and forget to avoid timeout)
    // We fetch settings again to get the decrypted keys (or decrypt them here)
    const { data: allSettings } = await supabase
        .from('user_settings')
        .select('gemini_api_key, groq_api_key, openai_api_key, selected_provider')
        .eq('user_id', user.id)
        .single()

    const provider = allSettings?.selected_provider || 'gemini'
    let apiKey = ''

    if (provider === 'groq' && allSettings?.groq_api_key) apiKey = decryptString(allSettings.groq_api_key)
    if (provider === 'openai' && allSettings?.openai_api_key) apiKey = decryptString(allSettings.openai_api_key)
        // Gemini uses internal auth or system env if no key provided

        // Execute via Factory
        (async () => {
            try {
                const service = AIFactory.getService(provider, apiKey, user.id);
                await service.process(storagePath, meeting.id);
            } catch (e) {
                console.error("Async processing failed:", e);
                const errorMessage = e instanceof Error ? e.message : "Unknown error";
                const supabaseAdmin = await createClient();
                await supabaseAdmin.from('meetings').update({
                    status: 'failed',
                    summary: `Processing Error: ${errorMessage}`
                }).eq('id', meeting.id)
            }
        })();

    return { success: true, meetingId: meeting.id }
}

export async function retryProcessing(meetingId: string) {
    const supabase = await createClient()
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
        const { decrypt } = await import("@/lib/crypto")
        const { data: allSettings } = await supabase
            .from('user_settings')
            .select('gemini_api_key, groq_api_key, openai_api_key, selected_provider')
            .eq('user_id', user.id)
            .single()

        const provider = allSettings?.selected_provider || 'gemini'
        let apiKey = ''
        if (provider === 'groq' && allSettings?.groq_api_key) apiKey = decryptString(allSettings.groq_api_key)
        if (provider === 'openai' && allSettings?.openai_api_key) apiKey = decryptString(allSettings.openai_api_key)

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
    const supabase = await createClient()
    const { data: meeting } = await supabase.from('meetings').select('status, transcript, summary').eq('id', meetingId).single()
    return meeting ? { status: meeting.status, hasTranscript: !!meeting.transcript } : null
}

export async function updateMeetingActionItems(meetingId: string, items: string[]) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('meetings')
        .update({ action_items: items })
        .eq('id', meetingId)

    if (error) console.error("Error updating action items:", error)
    revalidatePath(`/dashboard/${meetingId}`)
    return { success: !error }
}

export async function createNote(title: string, content: string) {
    const supabase = await createClient()

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
    const supabase = await createClient()
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    try {
        // Fetch Settings for Factory
        const { decrypt: decryptFn } = await import("@/lib/crypto")
        const { data: allSettings } = await supabase
            .from('user_settings')
            .select('gemini_api_key, groq_api_key, openai_api_key, selected_provider')
            .eq('user_id', user.id)
            .single()

        const provider = allSettings?.selected_provider || 'gemini'
        let apiKey = ''
        if (provider === 'groq' && allSettings?.groq_api_key) apiKey = decryptFn(allSettings.groq_api_key)
        if (provider === 'openai' && allSettings?.openai_api_key) apiKey = decryptFn(allSettings.openai_api_key)

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
    const supabase = await createClient()
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
    const supabase = await createClient()
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
        const { decrypt: decryptString } = await import("@/lib/crypto")
        const { data: allSettings } = await supabase
            .from('user_settings')
            .select('gemini_api_key, groq_api_key, openai_api_key, selected_provider')
            .eq('user_id', user.id)
            .single()

        const provider = allSettings?.selected_provider || 'gemini'
        let apiKey = ''
        if (provider === 'groq' && allSettings?.groq_api_key) apiKey = decryptString(allSettings.groq_api_key)
        if (provider === 'openai' && allSettings?.openai_api_key) apiKey = decryptString(allSettings.openai_api_key)

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
    const supabase = await createClient()
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

export async function upgradeTier(newTier: 'pro' | 'unlimited') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    // For 'unlimited', we rely on them adding a key, so this might just be a UI flag
    // But for 'pro', we update the DB.

    // Note: In a real app, strict validation of payment would happen here.

    const { error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            tier: newTier === 'unlimited' ? 'free' : newTier // If unlimited selected, they just need a key, but visually we might treat differently. Let's just store 'pro'.
        }, { onConflict: 'user_id' })

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const fullName = formData.get('full_name') as string
    const avatar = formData.get('avatar') as string

    // Update Supabase Auth Metadata (Standard way for simple profile data)
    const { error } = await supabase.auth.updateUser({
        data: {
            full_name: fullName,
            avatar_url: avatar
        }
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
    return { success: true }
}


export async function transcribeChunkAction(formData: FormData) {
    const supabase = await createClient()
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
    const supabase = await createClient()
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
