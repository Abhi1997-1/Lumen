'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function bulkDeleteMeetings(meetingIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    try {
        const { error } = await supabase
            .from('meetings')
            .delete()
            .in('id', meetingIds)
            .eq('user_id', user.id) // Security: Ensure user owns the meetings

        if (error) throw error

        revalidatePath('/dashboard/meetings')
        revalidatePath('/dashboard/folders')
        return { success: true }
    } catch (error: any) {
        console.error("Bulk delete failed:", error)
        return { success: false, error: error.message }
    }
}

export async function bulkMoveMeetings(meetingIds: string[], folderId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    try {
        const { error } = await supabase
            .from('meetings')
            .update({ folder_id: folderId })
            .in('id', meetingIds)
            .eq('user_id', user.id) // Security: Ensure user owns the meetings

        if (error) throw error

        revalidatePath('/dashboard/meetings')
        revalidatePath('/dashboard/folders')
        // Also revalidate the specific folder page if moving to a folder
        if (folderId) {
            revalidatePath(`/dashboard/folders/${folderId}`)
        }

        return { success: true }
    } catch (error: any) {
        console.error("Bulk move failed:", error)
        return { success: false, error: error.message }
    }
}
