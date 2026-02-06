'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateMeetingTitle(meetingId: string, newTitle: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('meetings')
            .update({ title: newTitle })
            .eq('id', meetingId)

        if (error) throw error
        revalidatePath(`/dashboard/${meetingId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateMeetingNotes(meetingId: string, notes: string) {
    try {
        const supabase = await createClient()
        // Ensure 'notes' column exists in your Supabase table!
        const { error } = await supabase
            .from('meetings')
            .update({ notes: notes })
            .eq('id', meetingId)

        if (error) throw error
        revalidatePath(`/dashboard/${meetingId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function renameSpeakerInTranscript(meetingId: string, currentTranscript: string, oldName: string, newName: string) {
    try {
        const supabase = await createClient()

        // Simple global replace for "Speaker X:" pattern
        // We use a regex to ensure we match the speaker label specifically, e.g. "Speaker 1:"
        // Escaping specific characters if needed, but usually names are simple.

        // Case 1: "Speaker 1:" -> "John:"
        const regexLabel = new RegExp(`${oldName}:`, 'g');
        let newTranscript = currentTranscript.replace(regexLabel, `${newName}:`);

        // Case 2: Just the name in text? usage depends on transcript format.
        // Usually mostly formatting is "Speaker X: text"

        const { error } = await supabase
            .from('meetings')
            .update({ transcript: newTranscript })
            .eq('id', meetingId)

        if (error) throw error
        revalidatePath(`/dashboard/${meetingId}`)
        return { success: true, newTranscript }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
