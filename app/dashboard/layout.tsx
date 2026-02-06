import { DashboardShell } from '@/components/dashboard-shell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { getMonthlyUsage } from "@/app/actions"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { used, limit, tier } = await getMonthlyUsage()

    return (
        <DashboardShell user={user} usageData={{ used: used || 0, limit: limit || 0, tier: tier || 'free' }}>
            {children}
        </DashboardShell>
    )
}
