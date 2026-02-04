import { createClient } from '@/lib/supabase/server'
import { MeetingRow } from '@/components/dashboard/meeting-row'
import { FolderList } from '@/components/folders/folder-list'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchInput } from '@/components/dashboard/search-input'
import { DateFilter } from '@/components/dashboard/date-filter'
import { PaginationControls } from '@/components/dashboard/pagination-controls'
import { DatePickerWithRange } from '@/components/dashboard/date-range-picker'
import { AdvancedSearchToggle } from '@/components/dashboard/advanced-search-toggle'

export default async function MeetingsPage({
    searchParams,
}: {
    searchParams: { page?: string, query?: string, date?: string, from_date?: string, to_date?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const currentPage = Number(searchParams?.page) || 1
    const query = searchParams?.query || ''
    const dateFilter = searchParams?.date || 'all'
    const fromDate = searchParams?.from_date
    const toDate = searchParams?.to_date

    // Config: 8 items per page
    const ITEMS_PER_PAGE = 8
    const from = (currentPage - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    // 1. Build Base Query for Filtering
    let dbQuery = supabase
        .from('meetings')
        .select('*, status, duration, participants', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // 2. Apply Search (Title OR Transcript)
    if (query) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,transcript.ilike.%${query}%`)
    }

    // 3. Apply Date Filter (Presets OR Custom Range)
    if (fromDate && toDate) {
        // Custom Range takes precedence
        dbQuery = dbQuery.gte('created_at', fromDate).lte('created_at', toDate)
    } else if (dateFilter !== 'all') {
        const now = new Date()
        let filterDate = new Date()

        switch (dateFilter) {
            case 'today':
                filterDate.setHours(0, 0, 0, 0)
                break;
            case 'week':
                filterDate.setDate(now.getDate() - 7)
                break;
            case 'month':
                filterDate.setDate(now.getDate() - 30)
                break;
        }

        dbQuery = dbQuery.gte('created_at', filterDate.toISOString())
    }

    // 4. Apply Pagination
    const { data: meetings, error, count } = await dbQuery.range(from, to)

    if (error) {
        console.error("Error fetching meetings:", error)
        return <div className="p-8 text-destructive">Error loading meetings.</div>
    }

    return (
        <div className="flex flex-col h-full gap-6 p-6 lg:p-8 max-w-[1600px] mx-auto w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">All Meetings</h1>
                    <p className="text-muted-foreground mt-1">
                        {count || 0} sessions recorded
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <SearchInput placeholder="Search meetings..." />

                    <AdvancedSearchToggle>
                        <DateFilter />
                    </AdvancedSearchToggle>

                    <Link href="/dashboard/new">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-9 text-sm px-4">
                            <Plus className="mr-2 h-4 w-4" /> New
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Folders Section */}
            <div className="shrink-0">
                <FolderList />
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
                                            <p className="text-xs text-muted-foreground/70">
                                                {query ? "Try adjusting your search terms." : "Start recording to see sessions here."}
                                            </p>
                                            {!query && (
                                                <Link href="/dashboard/new" className="mt-4">
                                                    <Button variant="outline">
                                                        Record Meeting
                                                    </Button>
                                                </Link>
                                            )}
                                        </td>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="shrink-0 border-t border-border bg-muted/10 p-3 text-xs text-muted-foreground flex items-center justify-between px-6">
                        <span>Showing <strong>{from + 1}</strong> to <strong>{Math.min(to + 1, count || 0)}</strong> of <strong>{count || 0}</strong> results</span>

                        <PaginationControls
                            totalCount={count || 0}
                            currentPage={currentPage}
                            pageSize={ITEMS_PER_PAGE}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
