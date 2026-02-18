"use client"

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Mic,
    Brain,
    Clock,
    Activity,
    Loader2,
    TrendingUp,
    Zap,
    Timer,
    Hash,
    ArrowLeft,
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, subDays, isSameDay } from 'date-fns'

// Groq free-tier rate limits
const RATE_LIMITS = {
    whisper: {
        audioSecondsPerHour: 7200,   // 2 hours of audio / hour
        requestsPerDay: 2000,
    },
    chat: {
        tokensPerMinute: 6000,
        requestsPerDay: 14400,
    },
}

function formatDuration(seconds: number): string {
    if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)}h`
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${seconds}s`
}

function formatTokens(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`
    return num.toString()
}

export default function UsagePage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [meetings, setMeetings] = useState<any[]>([])
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | 'ALL'>('7D')

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('meetings')
                .select('id, title, created_at, duration, input_tokens, output_tokens, model_used, status')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setMeetings(data)
        } catch (err) {
            console.error("Failed to fetch usage data:", err)
        } finally {
            setLoading(false)
        }
    }

    // ── Computed Stats ────────────────────────────────────────
    const stats = useMemo(() => {
        const now = new Date()
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)

        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

        const todayMeetings = meetings.filter(m => new Date(m.created_at) >= todayStart)
        const lastHourMeetings = meetings.filter(m => new Date(m.created_at) >= hourAgo)

        // Audio
        const audioSecondsLastHour = lastHourMeetings.reduce((s, m) => s + (m.duration || 0), 0)
        const audioRequestsToday = todayMeetings.filter(m => m.duration > 0).length

        // LLM tokens
        const tokensToday = todayMeetings.reduce((s, m) => s + (m.input_tokens || 0) + (m.output_tokens || 0), 0)
        const llmRequestsToday = todayMeetings.filter(m => (m.input_tokens || 0) > 0).length

        // All-time
        const totalAudioSeconds = meetings.reduce((s, m) => s + (m.duration || 0), 0)
        const totalTokens = meetings.reduce((s, m) => s + (m.input_tokens || 0) + (m.output_tokens || 0), 0)
        const totalInputTokens = meetings.reduce((s, m) => s + (m.input_tokens || 0), 0)
        const totalOutputTokens = meetings.reduce((s, m) => s + (m.output_tokens || 0), 0)

        return {
            audioSecondsLastHour,
            audioRequestsToday,
            tokensToday,
            llmRequestsToday,
            totalAudioSeconds,
            totalTokens,
            totalInputTokens,
            totalOutputTokens,
            totalMeetings: meetings.length,
        }
    }, [meetings])

    // ── Chart Data ────────────────────────────────────────────
    const chartData = useMemo(() => {
        const now = new Date()
        const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90

        const labels = Array.from({ length: days }, (_, i) => {
            const d = subDays(now, days - 1 - i)
            return { date: d, name: format(d, 'MMM d'), audioMin: 0, tokens: 0 }
        })

        meetings.forEach(m => {
            const mDate = new Date(m.created_at)
            const day = labels.find(d => isSameDay(d.date, mDate))
            if (day) {
                day.audioMin += Math.round((m.duration || 0) / 60)
                day.tokens += (m.input_tokens || 0) + (m.output_tokens || 0)
            }
        })

        return labels
    }, [meetings, timeRange])

    // ── Model Breakdown ──────────────────────────────────────
    const modelBreakdown = useMemo(() => {
        const map: Record<string, number> = {}
        meetings.forEach(m => {
            const model = m.model_used || 'Unknown'
            map[model] = (map[model] || 0) + 1
        })
        return Object.entries(map).sort((a, b) => b[1] - a[1])
    }, [meetings])

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    const audioPercent = Math.min(100, (stats.audioSecondsLastHour / RATE_LIMITS.whisper.audioSecondsPerHour) * 100)
    const audioReqPercent = Math.min(100, (stats.audioRequestsToday / RATE_LIMITS.whisper.requestsPerDay) * 100)
    const llmReqPercent = Math.min(100, (stats.llmRequestsToday / RATE_LIMITS.chat.requestsPerDay) * 100)

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground animate-in fade-in duration-300">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/dashboard/settings')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">API Usage</h1>
                                <p className="text-sm text-muted-foreground">Groq API consumption & rate limits</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1 self-start md:self-auto">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Free Tier
                        </Badge>
                    </div>

                    {/* ── Rate Limit Cards ───────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Audio Transcription Limits */}
                        <Card className="bg-card border-border">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <Mic className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <CardTitle className="text-base font-semibold">Audio Transcription</CardTitle>
                                </div>
                                <p className="text-xs text-muted-foreground">Whisper model usage limits</p>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Audio Seconds / Hour */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Timer className="h-3.5 w-3.5" />
                                            <span>Audio Seconds / Hour</span>
                                        </div>
                                        <span className="font-medium text-foreground">
                                            {formatDuration(stats.audioSecondsLastHour)} / {formatDuration(RATE_LIMITS.whisper.audioSecondsPerHour)}
                                        </span>
                                    </div>
                                    <Progress
                                        value={audioPercent}
                                        className={`h-2.5 rounded-full ${audioPercent > 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-blue-500'}`}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Rolling 1-hour window</p>
                                </div>

                                {/* Requests / Day */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Hash className="h-3.5 w-3.5" />
                                            <span>Requests / Day</span>
                                        </div>
                                        <span className="font-medium text-foreground">
                                            {stats.audioRequestsToday} / {RATE_LIMITS.whisper.requestsPerDay.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress
                                        value={audioReqPercent}
                                        className={`h-2.5 rounded-full ${audioReqPercent > 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-blue-500'}`}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Resets at midnight UTC</p>
                                </div>

                                {/* All-time stat */}
                                <div className="pt-2 border-t border-border">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Total transcribed (all time)</span>
                                        <span className="font-medium text-foreground">{formatDuration(stats.totalAudioSeconds)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* LLM Token Limits */}
                        <Card className="bg-card border-border">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <Brain className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <CardTitle className="text-base font-semibold">LLM Analysis</CardTitle>
                                </div>
                                <p className="text-xs text-muted-foreground">Chat model usage for summaries & AI questions</p>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Requests / Day */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Zap className="h-3.5 w-3.5" />
                                            <span>Requests / Day</span>
                                        </div>
                                        <span className="font-medium text-foreground">
                                            {stats.llmRequestsToday} / {RATE_LIMITS.chat.requestsPerDay.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress
                                        value={llmReqPercent}
                                        className={`h-2.5 rounded-full ${llmReqPercent > 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-purple-500'}`}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Resets at midnight UTC</p>
                                </div>

                                {/* Token breakdown */}
                                <div className="space-y-3 pt-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Tokens today</span>
                                        <span className="font-medium text-foreground">{formatTokens(stats.tokensToday)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-muted/50 p-3">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Input</div>
                                            <div className="text-lg font-bold text-foreground">{formatTokens(stats.totalInputTokens)}</div>
                                        </div>
                                        <div className="rounded-lg bg-muted/50 p-3">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Output</div>
                                            <div className="text-lg font-bold text-foreground">{formatTokens(stats.totalOutputTokens)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* All-time stat */}
                                <div className="pt-2 border-t border-border">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Total tokens (all time)</span>
                                        <span className="font-medium text-foreground">{formatTokens(stats.totalTokens)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Usage Over Time Chart ──────────────────── */}
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-foreground">Usage Over Time</CardTitle>
                            <div className="flex bg-muted rounded-lg p-1">
                                {(['7D', '30D', 'ALL'] as const).map(range => (
                                    <Button
                                        key={range}
                                        variant={timeRange === range ? 'default' : 'ghost'}
                                        onClick={() => setTimeRange(range)}
                                        size="sm"
                                        className={`h-7 text-xs px-3 ${timeRange === range ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {range === 'ALL' ? 'All' : `${range.replace('D', '')}D`}
                                    </Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} barGap={2}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                            tickFormatter={(v) => `${v}m`}
                                            width={40}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                            tickFormatter={(v) => formatTokens(v)}
                                            width={50}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--popover))',
                                                borderColor: 'hsl(var(--border))',
                                                color: 'hsl(var(--popover-foreground))',
                                                borderRadius: 'var(--radius)',
                                                fontSize: 12,
                                            }}
                                            formatter={(value, name) => {
                                                const v = typeof value === 'number' ? value : 0
                                                if (name === 'audioMin') return [`${v} min`, 'Audio']
                                                return [formatTokens(v), 'Tokens']
                                            }}
                                        />
                                        <Legend
                                            formatter={(value) => value === 'audioMin' ? 'Audio (min)' : 'LLM Tokens'}
                                            wrapperStyle={{ fontSize: 12 }}
                                        />
                                        <Bar yAxisId="left" dataKey="audioMin" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={20} />
                                        <Bar yAxisId="right" dataKey="tokens" fill="#a855f7" radius={[3, 3, 0, 0]} maxBarSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Bottom Section: Models + Recent Activity ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Model Breakdown */}
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Models Used</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {modelBreakdown.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No data yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {modelBreakdown.map(([model, count]) => (
                                            <div key={model} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                                                    <span className="text-sm text-muted-foreground truncate max-w-[180px]">{model}</span>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">{count}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="lg:col-span-2 bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {meetings.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No meetings processed yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {meetings.slice(0, 8).map(m => (
                                            <div
                                                key={m.id}
                                                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/dashboard/${m.id}`)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Badge
                                                        variant={m.status === 'completed' ? 'default' : m.status === 'failed' ? 'destructive' : 'secondary'}
                                                        className="text-[10px] shrink-0"
                                                    >
                                                        {m.status}
                                                    </Badge>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{m.title || 'Untitled'}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(m.created_at), 'MMM d, h:mm a')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                                                    {m.duration > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDuration(m.duration)}
                                                        </span>
                                                    )}
                                                    {(m.input_tokens || 0) > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Activity className="h-3 w-3" />
                                                            {formatTokens((m.input_tokens || 0) + (m.output_tokens || 0))}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    )
}
