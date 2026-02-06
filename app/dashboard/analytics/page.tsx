"use client"

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Users,
    Clock,
    Box,
    Download,
    Calendar,
    TrendingUp,
    PiggyBank,
    ArrowRight,
    Loader2
} from "lucide-react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, subDays, isSameDay, startOfMonth, isAfter, parseISO } from 'date-fns'
import { PaginationControls } from "@/components/dashboard/pagination-controls"

const ITEMS_PER_PAGE = 5

export default function AnalyticsPage() {
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()

    // State
    const [loading, setLoading] = useState(true)
    const [meetings, setMeetings] = useState<any[]>([])
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | 'ALL'>('7D')

    // Pagination State
    const currentPage = Number(searchParams.get('page')) || 1

    const [stats, setStats] = useState({
        totalMeetings: 0,
        totalHours: 0,
        totalTokens: 0,
        estCost: 0,
        savings: 0
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: meetingsData } = await supabase
                .from('meetings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (meetingsData) {
                // Process real data
                const processed = meetingsData.map(m => {
                    const durationSec = m.duration || 0;
                    const durationMin = Math.floor(durationSec / 60);
                    const durationRemSec = durationSec % 60;

                    const inputTokens = m.input_tokens || 0;
                    const outputTokens = m.output_tokens || 0;
                    const totalTokens = m.total_tokens || (inputTokens + outputTokens);

                    // Pricing for Gemini 1.5 Flash (approx)
                    const cost = ((inputTokens / 1_000_000) * 0.075) + ((outputTokens / 1_000_000) * 0.30);

                    return {
                        ...m,
                        durationStr: `${durationMin}m ${durationRemSec}s`,
                        tokens: totalTokens,
                        cost: cost,
                        formattedDate: format(new Date(m.created_at), 'MMM d, yyyy')
                    }
                })

                setMeetings(processed)

                // Calculate Totals (All Time)
                const totalM = processed.length
                const totalSec = processed.reduce((acc, curr) => acc + (curr.duration || 0), 0)
                const totalH = totalSec / 3600
                const totalTok = processed.reduce((acc, curr) => acc + curr.tokens, 0)
                const totalCost = processed.reduce((acc, curr) => acc + curr.cost, 0)
                const competitorCost = totalH * 1.00
                const savings = Math.max(0, competitorCost - totalCost)

                setStats({
                    totalMeetings: totalM,
                    totalHours: totalH,
                    totalTokens: totalTok,
                    estCost: totalCost,
                    savings: savings
                })
            }

        } catch (error) {
            console.error("Error fetching analytics:", error)
        } finally {
            setLoading(false)
        }
    }

    // Dynamic Chart Data
    const chartData = useMemo(() => {
        if (!meetings.length && loading) return []

        const now = new Date()
        let daysToLookBack = 7

        if (timeRange === '30D') daysToLookBack = 30
        if (timeRange === 'ALL') daysToLookBack = 90 // Cap 'All' at 90 days for chart readability for now

        const labels = Array.from({ length: daysToLookBack }, (_, i) => {
            const d = subDays(now, daysToLookBack - 1 - i)
            return {
                date: d,
                name: format(d, 'MMM d'),
                tokens: 0
            }
        })

        meetings.forEach(m => {
            const mDate = new Date(m.created_at)
            // For 'ALL', if we have data older than 90 days, we might miss it in this simple view
            // But for this purpose:
            const dayStat = labels.find(d => isSameDay(d.date, mDate))
            if (dayStat) {
                dayStat.tokens += m.tokens
            }
        })

        return labels
    }, [meetings, timeRange, loading])

    // Pagination Logic
    const currentTableData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return meetings.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [meetings, currentPage])

    const formatTokens = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
        return num.toString()
    }

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground animate-in fade-in duration-300">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Usage & Token Analytics</h1>
                            <p className="text-muted-foreground">Track your Gemini API consumption and cost savings.</p>
                        </div>
                        <div className="flex bg-muted rounded-lg p-1">
                            <Button
                                variant={timeRange === '7D' ? 'default' : 'ghost'}
                                onClick={() => setTimeRange('7D')}
                                size="sm"
                                className={`h-8 text-xs ${timeRange === '7D' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Last 7 Days
                            </Button>
                            <Button
                                variant={timeRange === '30D' ? 'default' : 'ghost'}
                                onClick={() => setTimeRange('30D')}
                                size="sm"
                                className={`h-8 text-xs ${timeRange === '30D' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Last 30 Days
                            </Button>
                            <Button
                                variant={timeRange === 'ALL' ? 'default' : 'ghost'}
                                onClick={() => setTimeRange('ALL')}
                                size="sm"
                                className={`h-8 text-xs ${timeRange === 'ALL' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                All Time
                            </Button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-card border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Meetings Processed</CardTitle>
                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-blue-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-foreground mb-2">{stats.totalMeetings}</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="flex items-center text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        <TrendingUp className="h-3 w-3 mr-1" /> 12%
                                    </span>
                                    <span className="text-muted-foreground">vs last month</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Hours Transcribed</CardTitle>
                                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-indigo-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-foreground mb-2">{stats.totalHours.toFixed(1)}h</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="flex items-center text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        <TrendingUp className="h-3 w-3 mr-1" /> 5%
                                    </span>
                                    <span className="text-muted-foreground">vs last month</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
                                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Box className="h-4 w-4 text-purple-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-foreground mb-2">{formatTokens(stats.totalTokens)}</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="flex items-center text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                        <TrendingUp className="h-3 w-3 mr-1" /> 8%
                                    </span>
                                    <span className="text-muted-foreground">vs last month</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Chart Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Token Usage History Chart */}
                        <Card className="lg:col-span-2 bg-card border-border">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Token Usage History</CardTitle>
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-400 h-8 gap-2">
                                    <Download className="h-3 w-3" /> Export Data
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                                tickFormatter={(value) => formatTokens(value as number)}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))', borderRadius: 'var(--radius)' }}
                                                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                                formatter={(value) => [formatTokens(value as number), 'Tokens']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="tokens"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorTokens)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Cost Savings Card */}
                        <Card className="bg-card border-border relative overflow-hidden">
                            {/* Background Decoration */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-50" />

                            <CardHeader>
                                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                    <PiggyBank className="h-5 w-5 text-emerald-500" />
                                </div>
                                <CardTitle className="text-lg font-semibold text-foreground">Cost Savings</CardTitle>
                                <p className="text-sm text-muted-foreground mt-2">
                                    You&apos;ve saved <span className="text-emerald-500 font-bold">${stats.savings.toFixed(2)}</span> this month compared to a standard premium plan.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Your API Cost</span>
                                    <span className="text-lg font-bold text-foreground">${stats.estCost.toFixed(2)}</span>
                                </div>
                                <div className="rounded-lg border border-border bg-muted p-4 flex items-center justify-between opacity-75">
                                    <span className="text-sm text-muted-foreground">Competitor Premium</span>
                                    <span className="text-lg font-bold text-muted-foreground line-through decoration-muted-foreground decoration-2">${(stats.totalMeetings * 10).toFixed(2)}</span>
                                </div>

                                <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20">
                                    View Breakdown
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Processed Meetings Table */}
                    <Card className="bg-card border-border">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-lg font-semibold text-foreground">Recent Processed Meetings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 mt-4">
                            <div className="overflow-x-auto min-h-[300px]">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Date</th>
                                            <th className="px-6 py-3 font-medium">Meeting Name</th>
                                            <th className="px-6 py-3 font-medium">Duration</th>
                                            <th className="px-6 py-3 font-medium">Tokens Used</th>
                                            <th className="px-6 py-3 font-medium text-right">Est. Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {currentTableData.map((meeting, i) => (
                                            <tr
                                                key={i}
                                                onClick={() => router.push(`/dashboard/${meeting.id}`)}
                                                className="hover:bg-muted/50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4 font-medium text-foreground">{meeting.formattedDate}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-2 rounded-full bg-blue-500`} />
                                                        <span className="text-muted-foreground group-hover:text-blue-500 transition-colors">{meeting.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">{meeting.durationStr}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary" className="bg-muted text-indigo-500 border-0">
                                                        {formatTokens(meeting.tokens)}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-emerald-500">${meeting.cost.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="p-4 border-t border-border flex flex-col items-center">
                                <PaginationControls
                                    totalCount={meetings.length}
                                    currentPage={currentPage}
                                    pageSize={ITEMS_PER_PAGE}
                                />
                                <div className="text-center mt-2 text-xs text-muted-foreground">
                                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, meetings.length)} of {meetings.length} results
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
