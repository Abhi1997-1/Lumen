'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export async function cancelMeetingProcessing(meetingId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    try {
        // Update meeting status to 'cancelled'
        const { error } = await supabase
            .from('meetings')
            .update({
                status: 'failed',
                summary: 'Processing cancelled by user'
            })
            .eq('id', meetingId)
            .eq('user_id', user.id) // Ensure user owns this meeting

        if (error) {
            console.error('Error cancelling meeting:', error)
            return { success: false, error: error.message }
        }

        revalidatePath(`/dashboard/${meetingId}`)
        revalidatePath('/dashboard/meetings')

        return { success: true }
    } catch (error: any) {
        console.error('Unexpected error cancelling meeting:', error)
        return { success: false, error: error.message }
    }
}
