'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function reprocessMeeting(meetingId: string, newModel: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    // Get meeting and check ownership
    const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .eq('user_id', user.id)
        .single()

    if (meetingError || !meeting) {
        return { success: false, error: 'Meeting not found' }
    }

    // Check for audio file (try both storage_path and audio_url for compatibility)
    const audioPath = meeting.audio_url || meeting.storage_path;

    if (!audioPath) {
        return { success: false, error: 'No audio file to reprocess' }
    }

    try {
        // Update meeting status to processing
        await supabase
            .from('meetings')
            .update({ status: 'processing' })
            .eq('id', meetingId)

        // Reprocess with Groq
        const { AIFactory } = await import("@/lib/ai/factory");
        const groqService = AIFactory.getService(user.id);

        // 1. Transcribe (if needed, or reuse transcript? Usually reprocess implies re-analyzing with a better model. 
        // But if the transcript was bad, we might want to re-transcribe. 
        // GroqService.analyze takes a transcript string.
        // If we don't have a good transcript, we should retranscribe.
        // Let's re-transcribe to be safe as this is a "reprocess" action, and we want to leverage Groq Whisper quality.
        const transcript = await groqService.transcribe(audioPath);

        // 2. Analyze
        await groqService.analyze(transcript, meetingId, newModel || 'llama-3.3-70b-versatile');

        revalidatePath(`/dashboard/meetings/${meetingId}`)
        revalidatePath('/dashboard/meetings')

        return { success: true }
    } catch (error: any) {
        console.error('Reprocess error:', error)

        // Restore status
        await supabase
            .from('meetings')
            .update({ status: 'completed' })
            .eq('id', meetingId)

        return {
            success: false,
            error: error.message || 'Reprocessing failed'
        }
    }
}
