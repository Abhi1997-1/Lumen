import { DashboardShell } from '@/components/dashboard-shell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { getCredits } from "@/app/actions"

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

    const { credits, tier, hasApiKey, isAdmin } = await getCredits()

    return (
        <DashboardShell user={user} usageData={{ credits, tier, hasApiKey, isAdmin }}>
            {children}
        </DashboardShell>
    )
}

