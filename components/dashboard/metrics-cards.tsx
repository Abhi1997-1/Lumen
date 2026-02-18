import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Box, Timer } from "lucide-react"

export async function MetricsCards() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch Meetings to calculate stats
    const { data: meetings } = await supabase
        .from('meetings')
        .select('created_at, transcript, total_tokens, duration, status')
        .eq('user_id', user.id)

    // Calculate Stats
    const totalMeetings = meetings?.length || 0

    let totalTokens = 0
    let processedCount = 0
    let totalDurationSeconds = 0

    meetings?.forEach(m => {
        // Count processed
        if (m.status === 'completed' || (m.transcript && m.transcript.length > 0)) {
            processedCount++
        }

        // Sum accurate tokens
        totalTokens += m.total_tokens || 0

        // Sum duration
        totalDurationSeconds += m.duration || 0
    })

    const formatTokens = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
        return num.toString()
    }

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        return `${h}h ${m}m`
    }

    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Meetings Card */}
            <Card className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Meetings
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">{totalMeetings}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Recorded sessions
                    </p>
                </CardContent>
            </Card>

            {/* Duration Card */}
            <Card className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Duration
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Timer className="h-4 w-4 text-purple-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">{formatDuration(totalDurationSeconds)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Hours recorded
                    </p>
                </CardContent>
            </Card>

            {/* Processed Card */}
            <Card className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Processed
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-emerald-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">{processedCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Transcripts generated
                    </p>
                </CardContent>
            </Card>

            {/* Token Usage Card */}
            <Card className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Token Usage
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Box className="h-4 w-4 text-amber-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">{formatTokens(totalTokens)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        AI processing tokens
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
