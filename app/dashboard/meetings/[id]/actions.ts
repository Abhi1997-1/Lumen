'use server'

import { createClient } from '@/lib/supabase/server'
import { processMeetingWithGemini } from '@/lib/gemini/service'
import { revalidatePath } from 'next/cache'

export async function reprocessMeeting(meetingId: string, newModel: string) {
    const supabase = await createClient()
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
    const audioPath = meeting.storage_path || meeting.audio_url

    if (!audioPath) {
        return { success: false, error: 'No audio file to reprocess' }
    }

    try {
        // Update meeting status to processing
        await supabase
            .from('meetings')
            .update({ status: 'processing' })
            .eq('id', meetingId)

        // Reprocess with selected model - route to correct provider
        let result

        if (newModel.startsWith('grok')) {
            // Use Grok API
            const { processMeetingWithGrok } = await import('@/lib/grok/service')
            result = await processMeetingWithGrok(user.id, audioPath, newModel)
        } else {
            // Use Gemini API (default)
            result = await processMeetingWithGemini(user.id, audioPath, newModel)
        }

        if (!result.success) {
            // Restore original status
            await supabase
                .from('meetings')
                .update({ status: 'completed' })
                .eq('id', meetingId)

            return {
                success: false,
                error: result.error,
                upgradePrompt: result.upgradePrompt,
                resetAt: result.resetAt
            }
        }

        // Update meeting with new results
        const { error: updateError } = await supabase
            .from('meetings')
            .update({
                transcript: result.transcript,
                summary: result.summary,
                action_items: result.action_items,
                key_topics: result.key_topics,
                sentiment: result.sentiment,
                status: 'completed',
                processing_model: newModel,
                reprocessed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', meetingId)

        if (updateError) {
            console.error('Update error:', updateError)
            return { success: false, error: 'Failed to save reprocessed results' }
        }

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
