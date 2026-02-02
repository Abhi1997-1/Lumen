import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MeetingView } from '@/components/meeting-view'

interface MeetingPageProps {
    params: {
        id: string
    }
}

export default async function MeetingPage({ params }: MeetingPageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: meeting } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!meeting) notFound()

    // Pass user and meeting data to the client component
    return <MeetingView meeting={meeting} user={user} />
}
