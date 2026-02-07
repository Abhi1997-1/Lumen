"use client"

import { useState } from "react"
import { MeetingRow } from "@/components/dashboard/meeting-row"
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash, FolderInput, X, Upload } from "lucide-react"
import { BulkDeleteDialog } from "@/components/dashboard/bulk-delete-dialog"
import { BulkMoveDialog } from "@/components/dashboard/bulk-move-dialog"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface MeetingListProps {
    meetings: any[]
    query?: string
}

export function MeetingList({ meetings, query }: MeetingListProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [showBulkDelete, setShowBulkDelete] = useState(false)
    const [showBulkMove, setShowBulkMove] = useState(false)

    const toggleSelection = (id: string, checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelectedIds(prev => prev.includes(id) ? prev : [...prev, id])
        } else {
            setSelectedIds(prev => prev.filter(item => item !== id))
        }
    }

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(meetings.map(m => m.id))
        } else {
            setSelectedIds([])
        }
    }

    const clearSelection = () => {
        setSelectedIds([])
    }

    const isAllSelected = meetings.length > 0 && selectedIds.length === meetings.length
    const isIndeterminate = selectedIds.length > 0 && selectedIds.length < meetings.length

    return (
        <div className="flex-1 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden relative">
            <div className="flex-1 overflow-auto custom-scrollbar">
                <Table>
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent border-b-2 border-border/50 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50">
                            {/* Checkbox Column */}
                            <TableHead className="w-[40px] pl-4 pr-0">
                                <Checkbox
                                    checked={isAllSelected || (isIndeterminate ? "indeterminate" : false)}
                                    onCheckedChange={(checked) => toggleAll(!!checked)}
                                />
                            </TableHead>

                            <TableHead className="w-[40%] pl-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meeting Name</TableHead>
                            <TableHead className="hidden md:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                            <TableHead className="hidden md:table-cell text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</TableHead>
                            <TableHead className="hidden md:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground">Participants</TableHead>
                            <TableHead className="hidden md:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                            <TableHead className="text-right pr-6"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {meetings && meetings.length > 0 ? (
                            meetings.map((meeting) => (
                                <MeetingRow
                                    key={meeting.id}
                                    meeting={meeting}
                                    selectable={true}
                                    checked={selectedIds.includes(meeting.id)}
                                    onCheckedChange={(checked) => toggleSelection(meeting.id, checked)}
                                    searchQuery={query}
                                />
                            ))
                        ) : (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={7} className="h-80">
                                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center">
                                            <Upload className="h-7 w-7 text-muted-foreground/60" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="font-medium text-foreground">No meetings found</p>
                                            <p className="text-sm text-muted-foreground">
                                                {query ? "Try adjusting your search terms." : "Start recording to see sessions here."}
                                            </p>
                                        </div>
                                        {!query && (
                                            <Link href="/dashboard/new">
                                                <Button variant="outline" size="sm" className="mt-2">
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Record Meeting
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Floating Action Bar */}
            <div className={cn(
                "fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-sm py-2 px-4 rounded-full shadow-xl flex items-center gap-4 transition-all duration-300 z-50",
                selectedIds.length > 0 ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
            )}>
                <span className="font-semibold px-2 border-r border-background/20">
                    {selectedIds.length} Selected
                </span>

                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-background hover:bg-background/20 hover:text-background"
                        onClick={() => setShowBulkMove(true)}
                    >
                        <FolderInput className="mr-2 h-4 w-4" /> Move
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                        onClick={() => setShowBulkDelete(true)}
                    >
                        <Trash className="mr-2 h-4 w-4" /> Delete
                    </Button>
                </div>

                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full hover:bg-background/20 text-background/50 hover:text-background ml-2"
                    onClick={clearSelection}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>

            <BulkDeleteDialog
                open={showBulkDelete}
                onOpenChange={setShowBulkDelete}
                meetingIds={selectedIds}
                onSuccess={clearSelection}
            />

            <BulkMoveDialog
                open={showBulkMove}
                onOpenChange={setShowBulkMove}
                meetingIds={selectedIds}
                onSuccess={clearSelection}
            />
        </div>
    )
}
