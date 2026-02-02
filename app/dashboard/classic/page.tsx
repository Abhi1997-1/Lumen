import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, FileText, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function ClassicDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: meetings } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#0a0a0a] p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Classic Dashboard</h1>
                    <p className="text-zinc-400">Access your meetings in the legacy layout.</p>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline">Back to New Dashboard</Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {meetings?.map((meeting) => (
                    <Link key={meeting.id} href={`/dashboard/classic/meeting/${meeting.id}`}>
                        <Card className="h-full bg-[#0F1116] border-[#1F2128] hover:border-blue-500/50 transition-colors group">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                                    {meeting.title || 'Untitled Meeting'}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(meeting.created_at).toLocaleDateString()}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-4">
                                    <p className="text-sm text-zinc-400 line-clamp-2">
                                        {meeting.summary || "No summary available."}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <Badge variant="secondary" className="bg-[#1F2128] text-zinc-400 border-zinc-800">
                                            {meeting.duration || '45m'}
                                        </Badge>
                                        <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
