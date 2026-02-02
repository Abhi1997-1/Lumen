import { createClient } from '@/lib/supabase/server'
import { MeetingRow } from '@/components/dashboard/meeting-row'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter, Upload } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { redirect } from 'next/navigation'
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function MeetingsPage() {
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

    if (error) {
        console.error("Error fetching meetings:", error)
        return <div className="p-8 text-destructive">Error loading meetings.</div>
    }

    return (
        <div className="flex flex-col h-full gap-6 p-6 lg:p-8 max-w-[1600px] mx-auto w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">All Meetings</h1>
                    <p className="text-muted-foreground mt-1">
                        {meetings?.length || 0} sessions recorded
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Snapshot search..."
                            className="pl-9 h-10 bg-background border-border"
                        />
                    </div>
                    <Button variant="outline" className="h-10 border-border bg-card hover:bg-accent text-foreground">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Link href="/dashboard/new">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-10">
                            <Plus className="mr-2 h-4 w-4" /> New Meeting
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Content - Scrollable Table */}
            <div className="flex-1 flex flex-col min-h-0">
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
                                            <p className="text-xs text-muted-foreground/70">Start recording to see sessions here.</p>
                                            <Link href="/dashboard/new" className="mt-4">
                                                <Button variant="outline">
                                                    Record Meeting
                                                </Button>
                                            </Link>
                                        </td>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}
