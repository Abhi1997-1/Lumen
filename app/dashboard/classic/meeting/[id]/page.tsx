import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MeetingProcessing } from '@/components/meeting-processing'
import { ActionItemChecklist } from '@/components/action-item-checklist'
import { MeetingHeader } from '@/components/meeting-header'
import { TranscriptView } from '@/components/transcript-view'
import { SummaryCard } from '@/components/summary-card'
import { SentimentCard } from '@/components/sentiment-card'
import { ExportButtons } from '@/components/export-buttons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MeetingPageProps {
    params: {
        id: string
    }
}

export default async function ClassicMeetingPage({ params }: MeetingPageProps) {
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

    if (!meeting.transcript && !meeting.summary) {
        return <div className="p-8"><MeetingProcessing /></div>
    }

    const duration = "45m"

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#0a0a0a]">
            {/* Header Section */}
            <div className="px-6 pt-6 shrink-0 flex items-center justify-between">
                <MeetingHeader
                    title={meeting.title || 'Untitled Meeting'}
                    date={meeting.created_at}
                    duration={duration}
                />
                <Link href={`/dashboard/${id}`}>
                    <Button variant="outline" className="text-zinc-400">Switch to AI View</Button>
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 md:gap-6 p-6 min-h-0 h-full overflow-hidden">

                {/* Left Panel: Transcript (Wide) */}
                <div className="lg:col-span-8 flex flex-col gap-6 min-h-0 h-full overflow-hidden">
                    <TranscriptView transcript={meeting.transcript || ""} />
                </div>

                {/* Right Panel: Intelligence Sidebar (Narrow) */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 pb-6 custom-scrollbar">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-500 font-bold text-lg">✦</span>
                        <h2 className="font-semibold text-white tracking-tight">Gemini Intelligence (Classic)</h2>
                    </div>

                    <SummaryCard summary={meeting.summary || ""} />

                    <Card className="bg-[#0F1116] border-[#1F2128]">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                            <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Action Items</CardTitle>
                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0 h-5 text-[10px]">
                                {meeting.action_items?.length || 0} OPEN
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <ActionItemChecklist initialItems={meeting.action_items || []} meetingId={meeting.id} />
                        </CardContent>
                    </Card>

                    <SentimentCard />
                    <ExportButtons />
                </div>
            </div>
        </div>
    )
}
