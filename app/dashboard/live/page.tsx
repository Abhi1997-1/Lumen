import { LiveRecorder } from '@/components/live-recorder'
import { Separator } from '@/components/ui/separator'

export default function LiveMeetingPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground animate-in fade-in duration-300">
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto h-full flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Audio Studio</h1>
                        <p className="text-zinc-400">Record voice notes and meetings with real-time transcription.</p>
                    </div>

                    <LiveRecorder />
                </div>
            </div>
        </div>
    )
}
