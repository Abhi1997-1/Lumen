'use server'

import { createClient } from "@supabase/supabase-js" // Use direct client for Service Role
import { createClient as createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Initialize Service Role Client (for admin operations)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkAdmin() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Use Admin Client to bypass RLS and ensure we can read the flag
    const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('is_admin')
        .eq('user_id', user.id)
        .single()

    return !!settings?.is_admin
}

export async function getAdminStats() {
    if (!await checkAdmin()) return { error: "Unauthorized" }

    try {
        // 1. Total Users
        const { count: totalUsers, error: userError } = await supabaseAdmin
            .from('user_settings')
            .select('*', { count: 'exact', head: true })

        if (userError) throw userError

        // 2. Pro Users
        const { count: proUsers, error: proError } = await supabaseAdmin
            .from('user_settings')
            .select('*', { count: 'exact', head: true })
            .eq('tier', 'pro')

        if (proError) throw proError

        // 3. Total Meetings processed
        const { count: totalMeetings, error: meetingError } = await supabaseAdmin
            .from('meetings')
            .select('*', { count: 'exact', head: true })

        if (meetingError) throw meetingError

        // 4. Total Credits Distributed
        const { data: creditSum, error: creditError } = await supabaseAdmin
            .from('user_settings')
            .select('credits_remaining')

        const totalCredits = creditSum?.reduce((acc, curr) => acc + (curr.credits_remaining || 0), 0) || 0

        return {
            totalUsers: totalUsers || 0,
            proUsers: proUsers || 0,
            totalMeetings: totalMeetings || 0,
            totalCredits
        }
    } catch (error: any) {
        console.error("Admin Stats Error:", error)
        return { error: error.message }
    }
}

export async function getUsersList(page: number = 1, search: string = '') {
    if (!await checkAdmin()) return { error: "Unauthorized" }

    const PAGE_SIZE = 20
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    try {
        // For MVP, List users from Auth Admin to get emails
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
            page: page,
            perPage: PAGE_SIZE
        })

        if (authError) throw authError

        // Fetch settings for these users
        const userIds = users.map(u => u.id)
        const { data: settings } = await supabaseAdmin
            .from('user_settings')
            .select('*')
            .in('user_id', userIds)

        // Merge data
        const combined = users.map(user => {
            const setting = settings?.find(s => s.user_id === user.id)
            return {
                id: user.id,
                email: user.email,
                tier: setting?.tier || 'free',
                credits: setting?.credits_remaining || 0,
                isAdmin: !!setting?.is_admin,
                lastSignIn: user.last_sign_in_at,
                createdAt: user.created_at
            }
        })

        return { users: combined, total: 1000 }
    } catch (error: any) {
        console.error("Get Users Error:", error)
        return { error: error.message }
    }
}


export async function grantCredits(userId: string, amount: number) {
    if (!await checkAdmin()) return { error: "Unauthorized" }

    try {
        const { data: settings } = await supabaseAdmin
            .from('user_settings')
            .select('credits_remaining')
            .eq('user_id', userId)
            .single()

        const current = settings?.credits_remaining || 0
        const newAmount = current + amount

        const { error } = await supabaseAdmin
            .from('user_settings')
            .update({ credits_remaining: newAmount })
            .eq('user_id', userId)

        if (error) throw error

        await supabaseAdmin.from('credit_transactions').insert({
            user_id: userId,
            amount: amount,
            type: 'admin_grant',
            description: `Admin granted ${amount} credits`,
        })

        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
