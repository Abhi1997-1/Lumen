"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Eye, Pencil, Trash, FolderInput } from "lucide-react"
import { TableRow, TableCell } from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoveToFolderDialog } from "@/components/folders/move-to-folder-dialog"
import { DeleteMeetingDialog } from "@/components/dashboard/delete-meeting-dialog"
import { useState } from "react"

import { Checkbox } from "@/components/ui/checkbox"

interface MeetingRowProps {
    meeting: {
        id: string
        title: string
        created_at: string
        summary: string | null
        transcript: string | null
        duration: number | null
        participants: string[] | null
        status: string | null
        folder_id: string | null
    }
    selectable?: boolean
    checked?: boolean | 'indeterminate'
    onCheckedChange?: (checked: boolean | 'indeterminate') => void
    searchQuery?: string
}

export function MeetingRow({ meeting, selectable, checked, onCheckedChange, searchQuery }: MeetingRowProps) {
    const status = meeting.status || (meeting.transcript ? "completed" : "processing")

    // ... (keep existing statusConfig and currentStatus logic)

    const statusConfig = {
        completed: { label: "Completed", color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10", dot: "bg-emerald-500" },
        processing: { label: "Processing", color: "text-blue-500 border-blue-500/30 bg-blue-500/10 animate-pulse", dot: "bg-blue-500" },
        failed: { label: "Failed", color: "text-red-500 border-red-500/30 bg-red-500/10", dot: "bg-red-500" },
    }

    const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing

    // ... (keep formattedDate and duration)
    const formattedDate = new Date(meeting.created_at).toLocaleDateString("en-US", {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })

    const formatDuration = (seconds: number) => {
        if (!seconds) return "--"
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}m ${s}s`
    }
    const duration = formatDuration(meeting.duration || 0)

    // ... (keep participants)
    const participants = meeting.participants || []
    const displayParticipants = participants.slice(0, 3)
    const extraCount = Math.max(0, participants.length - 3)

    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    return (
        <>
            <TableRow
                className={`group hover:bg-muted/50 transition-colors cursor-pointer ${checked ? 'bg-muted/50' : ''}`}
            >
                {/* Cell 0: Checkbox (Conditional) */}
                {selectable && (
                    <TableCell className="w-[40px] pl-4 pr-0">
                        <Checkbox
                            checked={checked}
                            onCheckedChange={onCheckedChange}
                            onClick={(e) => e.stopPropagation()}
                            className="translate-y-[2px]"
                        />
                    </TableCell>
                )}

                {/* Cell 1: Name and Icon */}
                <TableCell className={selectable ? "pl-4" : "pl-6"}>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-lg">
                                {meeting.title ? meeting.title.substring(0, 1).toUpperCase() : 'M'}
                            </span>
                        </div>

                        <div className="flex flex-col">
                            <Link href={href} className="flex-1 flex items-center min-w-0">
                                <span className="font-semibold text-sm text-foreground hover:underline underline-offset-4 decoration-primary/50 block truncate max-w-[200px] sm:max-w-[300px]">
                                    {meeting.title || "Untitled Meeting"}
                                </span>
                            </Link>
                            <span className="text-xs text-muted-foreground">Product Team</span>
                        </div>
                    </div>
                </TableCell>

                {/* Cell 2: Date */}
                <TableCell className="hidden md:table-cell text-muted-foreground whitespace-nowrap">
                    {formattedDate}
                </TableCell>

                {/* Cell 3: Duration */}
                <TableCell className="hidden md:table-cell text-right text-muted-foreground whitespace-nowrap">
                    {duration}
                </TableCell>

                {/* Cell 4: Participants */}
                <TableCell className="hidden md:table-cell">
                    <div className="flex -space-x-2">
                        {displayParticipants.map((p, i) => (
                            <div key={i} className="h-6 w-6 rounded-full bg-muted border border-card flex items-center justify-center text-[10px] text-muted-foreground uppercase" title={p}>
                                {p.split(' ')[1] || 'P'}
                            </div>
                        ))}
                        {extraCount > 0 && (
                            <div className="h-6 w-6 rounded-full bg-muted border border-card flex items-center justify-center text-[10px] text-muted-foreground">+{extraCount}</div>
                        )}
                        {participants.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
                    </div>
                </TableCell>

                {/* Cell 5: Status */}
                <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className={currentStatus.color}>
                        <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />
                        {currentStatus.label}
                    </Badge>
                </TableCell>

                {/* Cell 6: Actions */}
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <Link href={`/dashboard/${meeting.id}`}>
                                <DropdownMenuItem className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>View Details</span>
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Rename</span>
                            </DropdownMenuItem>

                            <MoveToFolderDialog meetingId={meeting.id} currentFolderId={meeting.folder_id}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                    <FolderInput className="mr-2 h-4 w-4" />
                                    <span>Move to Folder</span>
                                </DropdownMenuItem>
                            </MoveToFolderDialog>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault()
                                    setShowDeleteDialog(true)
                                }}
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/20"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>

            <DeleteMeetingDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                meetingId={meeting.id}
                meetingTitle={meeting.title || "Untitled Meeting"}
            />
        </>
    )
}
