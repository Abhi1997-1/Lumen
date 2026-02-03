import { Button } from "@/components/ui/button"
import Image from "next/image"

export function ExportButtons({ meetingId }: { meetingId?: string }) {
    return (
        <div className="space-y-4">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Push to App</div>
            <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11 bg-[#1F2128] border-white/5 text-zinc-300 hover:bg-white/10 hover:text-white justify-center gap-2">
                    {/* Placeholder Icons or text */}
                    <span className="font-semibold">N</span> Notion
                </Button>
                <Button variant="outline" className="h-11 bg-[#1F2128] border-white/5 text-zinc-300 hover:bg-white/10 hover:text-white justify-center gap-2">
                    <span className="font-semibold">N</span> OneNote
                </Button>
            </div>
        </div>
    )
}
