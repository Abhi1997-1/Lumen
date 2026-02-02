'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Progress } from "@/components/ui/progress"

export function MeetingProcessing() {
    const router = useRouter()
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Fake progress for visual feedback
        const timer = setInterval(() => {
            setProgress((oldProgress) => {
                if (oldProgress === 100) {
                    return 0;
                }
                const diff = Math.random() * 10;
                return Math.min(oldProgress + diff, 90);
            })
        }, 800)

        // Poll every 3 seconds to check if processing is done
        const interval = setInterval(() => {
            router.refresh()
        }, 3000)

        return () => {
            clearInterval(timer)
            clearInterval(interval)
        }
    }, [router])

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center p-8 border rounded-lg border-dashed">
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                    <div className="relative bg-background p-4 rounded-full border shadow-sm">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </div>
                <Progress value={progress} className="w-full" />
            </div>
            <div className="space-y-2 max-w-md">
                <h3 className="text-xl font-semibold">Processing Meeting...</h3>
                <p className="text-muted-foreground text-sm">
                    AI is transcribing audio, identifying speakers, and generating a summary.
                    This usually takes 30-60 seconds.
                </p>
                <p className="text-xs text-muted-foreground/50 pt-4">
                    The page will update automatically.
                </p>
            </div>
        </div>
    )
}
