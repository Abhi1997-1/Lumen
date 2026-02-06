import { createClient } from '@/lib/supabase/server'
import { MetricsCards } from '@/components/dashboard/metrics-cards'
import { MeetingRow } from '@/components/dashboard/meeting-row'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Bot, Search, Bell, ChevronRight, Mic } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { redirect } from 'next/navigation'
import { ModeToggle } from "@/components/theme-toggle"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: meetings, error } = await supabase
        .from('meetings')
        .select('*, status, duration, participants')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    const { data: userSettings } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .eq('user_id', user.id)
        .single()

    const showApiKeyBanner = !userSettings?.gemini_api_key

    if (error) {
        console.error("Error fetching meetings:", error)
        return <div className="p-8 text-destructive">Error loading meetings.</div>
    }

    return (
        <div className="flex flex-col h-full gap-6 p-6 lg:p-8 max-w-[1600px] mx-auto w-full overflow-hidden">
            {/* Scrollable Content Wrapper if needed, or just specific sections */}

            {/* Header Area */}
            <div className="shrink-0 flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Recent Meetings</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage and review your transcribed sessions
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative w-full md:w-64 mr-2">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search transcripts..."
                                className="pl-9 h-10 bg-background border-border"
                            />
                        </div>
                        <ModeToggle />

                        <div className="flex items-center gap-2">
                            <Link href="/dashboard/new?tab=upload">
                                <Button variant="outline" className="shadow-sm">
                                    <Upload className="mr-2 h-4 w-4" /> Upload
                                </Button>
                            </Link>
                            <Link href="/dashboard/new?tab=record">
                                <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20">
                                    <Mic className="mr-2 h-4 w-4" /> Record
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Unlock Intelligence Banner */}
                {showApiKeyBanner && (
                    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
                            <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                    <Bot className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-foreground">Connect Your API Key</h3>
                                        <div className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-600 dark:text-yellow-500 border border-yellow-500/20">
                                            SETUP REQUIRED
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground max-w-xl">
                                        To enable AI features like auto-summarization and action items, you need to connect your Gemini API key in settings.
                                        <br />
                                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 mt-1">
                                            Get your key from Google AI Studio
                                        </a>
                                    </p>
                                </div>
                            </div>
                            <Link href="/dashboard/settings">
                                <Button className="shadow-lg shadow-primary/20 shrink-0">
                                    Connect API Key
                                </Button>
                            </Link>
                        </div>
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
                        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl opacity-50" />
                    </div>
                )}

                {/* Metrics */}
                <MetricsCards />
            </div>

            {/* Meeting List Table - Flexible Height */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-1">
                    <Link href="/dashboard/meetings" className="group flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <h2 className="text-xl font-bold tracking-tight">Meetings Overview</h2>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                    <Link href="/dashboard/meetings">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                            View All
                        </Button>
                    </Link>
                </div>
                <div className="flex-1 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead className="w-[40%] pl-6">Meeting Name</TableHead>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                    <TableHead className="hidden md:table-cell text-right">Duration</TableHead>
                                    <TableHead className="hidden md:table-cell">Participants</TableHead>
                                    <TableHead className="hidden md:table-cell">Status</TableHead>
                                    <TableHead className="text-right pr-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {meetings && meetings.length > 0 ? (
                                    meetings.map((meeting) => (
                                        <MeetingRow key={meeting.id} meeting={meeting} />
                                    ))
                                ) : (
                                    <TableRow>
                                        <td colSpan={6} className="h-96 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                                            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                                                <Upload className="h-6 w-6 text-muted-foreground/50" />
                                            </div>
                                            <p>No meetings found.</p>
                                            <p className="text-xs text-muted-foreground/70">Upload a recording to get started!</p>
                                        </td>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    {meetings && meetings.length > 0 && (
                        <div className="shrink-0 border-t border-border bg-muted/10 p-3 text-xs text-muted-foreground flex items-center justify-between px-6">
                            <span>Showing <strong>1</strong> to <strong>{meetings?.length || 0}</strong> of <strong>{meetings?.length || 0}</strong> results</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
