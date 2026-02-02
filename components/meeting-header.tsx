import Link from "next/link"
import { ArrowLeft, Share2, Bell, Calendar, Clock, Video, Search, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

interface MeetingHeaderProps {
    title: string
    date: string
    duration?: string
    platform?: string
}

export function MeetingHeader({ title, date, duration = "45m", platform = "Zoom Meeting" }: MeetingHeaderProps) {
    return (
        <div className="flex flex-col gap-6 pb-6 border-b border-border/40">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link href="/dashboard" className="flex items-center gap-2 hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                    <span className="text-muted-foreground/40">/</span>
                    <div className="flex items-center gap-2">
                        <span className="hover:text-foreground cursor-pointer transition-colors">Product</span>
                        <span className="text-muted-foreground/40">›</span>
                        <span className="text-foreground">Q3 Planning</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-2 bg-[#1F2128] border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-[#1F2128] border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white">
                        <Bell className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Title & Metadata Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-zinc-500" />
                            <span>{format(new Date(date), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-zinc-500" />
                            <span>{format(new Date(date), "h:mm a")} • {duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-zinc-500" />
                            <span>{platform}</span>
                        </div>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] px-2 py-0.5 h-5">
                            COMPLETE
                        </Badge>
                    </div>
                </div>

                <div className="relative w-full lg:w-[320px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search transcript keywords..."
                        className="pl-9 h-10 bg-[#0F1116] border-[#1F2128] text-sm focus-visible:ring-blue-500/50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-muted bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>
            </div>
        </div>
    )
}
