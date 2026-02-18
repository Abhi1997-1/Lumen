import { createClient } from '@/lib/supabase/server'
import { MeetingRow } from '@/components/dashboard/meeting-row'
import { MeetingList } from '@/components/dashboard/meeting-list'
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
    searchParams: Promise<{ page?: string, query?: string, date?: string, from_date?: string, to_date?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const resolvedParams = await searchParams
    const currentPage = Number(resolvedParams?.page) || 1
    const query = resolvedParams?.query || ''
    const dateFilter = resolvedParams?.date || 'all'
    const fromDate = resolvedParams?.from_date
    const toDate = resolvedParams?.to_date

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
                <MeetingList meetings={meetings || []} query={query} />
            </div>
        </div>
    )
}
