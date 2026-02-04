import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ExportButtons } from "@/components/export-buttons"

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return notFound()

    const { data: meeting } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single()

    if (!meeting || meeting.user_id !== user.id) {
        return notFound()
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{meeting.title}</h1>
                <div className="flex gap-2">
                    <ExportButtons />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 h-full min-h-[500px]">
                {/* Transcript */}
                <div className="rounded-lg border p-4 bg-card overflow-y-auto max-h-[calc(100vh-200px)]">
                    <h2 className="font-semibold mb-4 text-muted-foreground uppercase text-xs tracking-wider">Transcript</h2>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground/90">
                        {meeting.transcript || "No transcript available yet. Please wait for processing."}
                    </div>
                </div>

                {/* Summary */}
                <div className="rounded-lg border p-4 bg-card overflow-y-auto max-h-[calc(100vh-200px)]">
                    <h2 className="font-semibold mb-4 text-muted-foreground uppercase text-xs tracking-wider">Intelligence</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                            <p className="text-sm text-card-foreground/80 leading-relaxed whitespace-pre-wrap">
                                {meeting.summary || "No summary available."}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Action Items</h3>
                            {meeting.action_items && Array.isArray(meeting.action_items) && meeting.action_items.length > 0 ? (
                                <ul className="list-disc pl-4 space-y-2">
                                    {meeting.action_items.map((item: string, i: number) => (
                                        <li key={i} className="text-sm text-card-foreground/90">{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No action items detected.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
