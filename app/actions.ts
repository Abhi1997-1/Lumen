'use server'

import { createClient } from "@/lib/supabase/server"
import { processMeetingWithGemini } from "@/lib/gemini/service"
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

    // Trigger Gemini processing (Fire and forget-ish)
    // We do NOT await this so the user isn't stuck waiting.
    // In Vercel serverless, this might be terminated early, but for now this fixes the "Stuck" UI.
    // Ideally use a background job queue (e.g. Inngest/Temporal) for production.
    processMeetingWithGemini(user.id, storagePath)
        .then(async (result) => {
            // Calculate estimated duration if not provided
            const wordCount = result.transcript ? result.transcript.trim().split(/\s+/).length : 0;
            const estimatedDuration = Math.ceil(wordCount / 2.5);
            const finalDuration = durationSeconds > 0 ? durationSeconds : estimatedDuration;

            await supabase
                .from('meetings')
                .update({
                    transcript: result.transcript,
                    summary: result.summary,
                    action_items: result.action_items,
                    input_tokens: result.usage?.input_tokens || 0,
                    output_tokens: result.usage?.output_tokens || 0,
                    total_tokens: result.usage?.total_tokens || 0,
                    status: 'completed',
                    participants: result.participants || [],
                    duration: finalDuration
                })
                .eq('id', meeting.id)
        })
        .catch(async (e) => {
            console.error("Async processing failed:", e);
            await supabase.from('meetings').update({ status: 'failed' }).eq('id', meeting.id)
        })

    return { success: true, meetingId: meeting.id }
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

export async function askGemini(context: string, question: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    try {
        const { generateAnswer } = await import('@/lib/gemini/service')
        const answer = await generateAnswer(user.id, context, question)
        return { success: true, answer }
    } catch (error: any) {
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

export async function askFolderGemini(folderId: string, question: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    try {
        const { processFolderChat } = await import('@/lib/gemini/service')
        const answer = await processFolderChat(user.id, folderId, question)
        return { success: true, answer }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
