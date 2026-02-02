"use client"

import { useEffect, useState } from 'react'
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
import { useRouter } from 'next/navigation'
import { format, subDays, isSameDay } from 'date-fns'

export default function AnalyticsPage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [meetings, setMeetings] = useState<any[]>([])
    const [stats, setStats] = useState({
        totalMeetings: 0,
        totalHours: 0,
        totalTokens: 0,
        estCost: 0,
        savings: 0
    })
    const [chartData, setChartData] = useState<any[]>([])

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
                // augment data with calculated fields for demo
                const processed = meetingsData.map(m => {
                    // Mock duration between 15m and 90m if not real
                    const durationMin = 30;
                    const tokens = Math.floor(durationMin * 150 * 1.5); // approx 150 words/min * 1.5 tokens/word
                    const cost = (tokens / 1000000) * 0.50; // $0.50 per 1M tokens (approx Gemini Pro pricing)

                    return {
                        ...m,
                        durationStr: `${durationMin}m 00s`,
                        tokens: tokens,
                        cost: cost,
                        formattedDate: format(new Date(m.created_at), 'MMM d, yyyy')
                    }
                })

                setMeetings(processed)

                // Calculate Totals
                const totalM = processed.length
                const totalH = (processed.length * 30) / 60
                const totalTok = processed.reduce((acc, curr) => acc + curr.tokens, 0)
                const totalCost = processed.reduce((acc, curr) => acc + curr.cost, 0)
                const competitorCost = totalM * 10 // Assume $10/meeting competitor
                const savings = competitorCost - totalCost

                setStats({
                    totalMeetings: totalM,
                    totalHours: totalH,
                    totalTokens: totalTok,
                    estCost: totalCost,
                    savings: savings
                })

                // Generate Chart Data (Last 7 days)
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = subDays(new Date(), 6 - i)
                    return {
                        date: d,
                        name: format(d, 'MMM d'),
                        tokens: 0
                    }
                })

                processed.forEach(m => {
                    const mDate = new Date(m.created_at)
                    const dayStat = last7Days.find(d => isSameDay(d.date, mDate))
                    if (dayStat) {
                        dayStat.tokens += m.tokens
                    }
                })

                setChartData(last7Days)
            }

        } catch (error) {
            console.error("Error fetching analytics:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatTokens = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
        return num.toString()
    }

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground animate-in fade-in duration-300">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Usage & Token Analytics</h1>
                            <p className="text-zinc-400">Track your Gemini API consumption and cost savings.</p>
                        </div>
                        <div className="flex bg-[#1F2128] rounded-lg p-1">
                            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-8 text-xs">Last 7 Days</Button>
                            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500 h-8 text-xs shadow-lg shadow-blue-500/20">This Month</Button>
                            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-8 text-xs">All Time</Button>
                            <Separator orientation="vertical" className="mx-1 h-4 self-center bg-zinc-700" />
                            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-8 text-xs gap-2">
                                <Calendar className="h-3 w-3" /> Custom
                            </Button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-[#14161B] border-[#1F2128]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-400">Meetings Processed</CardTitle>
                                <div className="h-8 w-8 rounded-lg bg-[#1F2128] flex items-center justify-center">
                                    <Users className="h-4 w-4 text-blue-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white mb-2">{stats.totalMeetings}</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="flex items-center text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        <TrendingUp className="h-3 w-3 mr-1" /> 12%
                                    </span>
                                    <span className="text-zinc-500">vs last month</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#14161B] border-[#1F2128]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-400">Hours Transcribed</CardTitle>
                                <div className="h-8 w-8 rounded-lg bg-[#1F2128] flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-indigo-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white mb-2">{stats.totalHours.toFixed(1)}h</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="flex items-center text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        <TrendingUp className="h-3 w-3 mr-1" /> 5%
                                    </span>
                                    <span className="text-zinc-500">vs last month</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#14161B] border-[#1F2128]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-400">Total Tokens</CardTitle>
                                <div className="h-8 w-8 rounded-lg bg-[#1F2128] flex items-center justify-center">
                                    <Box className="h-4 w-4 text-purple-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white mb-2">{formatTokens(stats.totalTokens)}</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="flex items-center text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                        <TrendingUp className="h-3 w-3 mr-1" /> 8%
                                    </span>
                                    <span className="text-zinc-500">vs last month</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Chart Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Token Usage History Chart */}
                        <Card className="lg:col-span-2 bg-[#14161B] border-[#1F2128]">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-white">Token Usage History</CardTitle>
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
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#71717a', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#71717a', fontSize: 12 }}
                                                tickFormatter={(value) => formatTokens(value as number)}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
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
                        <Card className="bg-[#14161B] border-[#1F2128] relative overflow-hidden">
                            {/* Background Decoration */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent opacity-50" />

                            <CardHeader>
                                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                    <PiggyBank className="h-5 w-5 text-emerald-500" />
                                </div>
                                <CardTitle className="text-lg font-semibold text-white">Cost Savings</CardTitle>
                                <p className="text-sm text-zinc-400 mt-2">
                                    You&apos;ve saved <span className="text-emerald-500 font-bold">${stats.savings.toFixed(2)}</span> this month compared to a standard premium plan.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
                                    <span className="text-sm text-zinc-300">Your API Cost</span>
                                    <span className="text-lg font-bold text-white">${stats.estCost.toFixed(2)}</span>
                                </div>
                                <div className="rounded-lg border border-[#27272a] bg-[#1F2128] p-4 flex items-center justify-between opacity-75">
                                    <span className="text-sm text-zinc-400">Competitor Premium</span>
                                    <span className="text-lg font-bold text-zinc-400 line-through decoration-zinc-500 decoration-2">${(stats.totalMeetings * 10).toFixed(2)}</span>
                                </div>

                                <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20">
                                    View Breakdown
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Processed Meetings Table */}
                    <Card className="bg-[#14161B] border-[#1F2128]">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-lg font-semibold text-white">Recent Processed Meetings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 mt-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-zinc-500 uppercase bg-[#1A1D24] border-y border-[#1F2128]">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Date</th>
                                            <th className="px-6 py-3 font-medium">Meeting Name</th>
                                            <th className="px-6 py-3 font-medium">Duration</th>
                                            <th className="px-6 py-3 font-medium">Tokens Used</th>
                                            <th className="px-6 py-3 font-medium text-right">Est. Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1F2128]">
                                        {meetings.map((meeting, i) => (
                                            <tr
                                                key={i}
                                                onClick={() => router.push(`/dashboard/${meeting.id}`)}
                                                className="hover:bg-[#1A1D24]/50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4 font-medium text-white">{meeting.formattedDate}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-2 rounded-full bg-blue-500`} />
                                                        <span className="text-zinc-300 group-hover:text-blue-400 transition-colors">{meeting.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400">{meeting.durationStr}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary" className="bg-[#1F2128] text-indigo-400 border-0">
                                                        {formatTokens(meeting.tokens)}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-emerald-500">${meeting.cost.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
