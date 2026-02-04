'use server'

import { createClient } from "@/lib/supabase/server"

export async function getIntegrationsStatus() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { notion: false, onenote: false }

    const { data: integrations } = await supabase
        .from('integrations')
        .select('provider')
        .eq('user_id', user.id)

    const status = {
        notion: integrations?.some(i => i.provider === 'notion') || false,
        onenote: integrations?.some(i => i.provider === 'onenote') || false
    }

    return status
}

export async function disconnectIntegration(provider: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider)

    if (error) return { success: false, error: error.message }
    return { success: true }
}
