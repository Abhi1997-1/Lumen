import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Calendar, Clock, ChevronRight } from 'lucide-react'

interface MeetingCardProps {
    meeting: {
        id: string
        title: string
        created_at: string
        summary: string | null
    }
}

export function MeetingCard({ meeting }: MeetingCardProps) {
    const date = new Date(meeting.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
    const time = new Date(meeting.created_at).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <Link href={`/dashboard/${meeting.id}`} className="block transition-transform hover:scale-[1.01]">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{meeting.title || 'Untitled Meeting'}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {date}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {meeting.summary ? meeting.summary : 'No summary available.'}
                    </p>
                </CardContent>
                <CardFooter className="pt-0">
                    <span className="flex items-center text-xs text-primary font-medium">
                        View Details <ChevronRight className="ml-1 h-3 w-3" />
                    </span>
                </CardFooter>
            </Card>
        </Link>
    )
}
