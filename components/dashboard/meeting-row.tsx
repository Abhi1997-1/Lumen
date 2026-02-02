import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"
import { TableRow, TableCell } from "@/components/ui/table"

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
    }
}

export function MeetingRow({ meeting }: MeetingRowProps) {
    const status = meeting.status || (meeting.transcript ? "completed" : "processing")

    // Status config
    const statusConfig = {
        completed: { label: "Completed", color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10", dot: "bg-emerald-500" },
        processing: { label: "Processing", color: "text-blue-500 border-blue-500/30 bg-blue-500/10 animate-pulse", dot: "bg-blue-500" },
        failed: { label: "Failed", color: "text-red-500 border-red-500/30 bg-red-500/10", dot: "bg-red-500" },
    }

    const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing

    // Using formattedDate for consistency
    const formattedDate = new Date(meeting.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })

    // Format Duration
    const formatDuration = (seconds: number) => {
        if (!seconds) return "--"
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}m ${s}s`
    }
    const duration = formatDuration(meeting.duration || 0)

    // Participants
    const participants = meeting.participants || []
    const displayParticipants = participants.slice(0, 3)
    const extraCount = Math.max(0, participants.length - 3)

    return (
        <TableRow className="group hover:bg-muted/50 transition-colors cursor-pointer">
            {/* Cell 1: Name and Icon */}
            <TableCell>
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-lg">
                            {meeting.title ? meeting.title.substring(0, 1).toUpperCase() : 'M'}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <Link href={`/dashboard/${meeting.id}`} className="block">
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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    )
}
