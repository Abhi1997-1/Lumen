'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, Zap } from "lucide-react"
import Link from "next/link"

interface RateLimitErrorProps {
    open: boolean
    onClose: () => void
    message: string
    resetAt: Date
    showUpgrade?: boolean
}

export function RateLimitErrorDialog({
    open,
    onClose,
    message,
    resetAt,
    showUpgrade = false
}: RateLimitErrorProps) {
    const timeUntilReset = resetAt.getTime() - Date.now()
    const hoursUntilReset = Math.max(1, Math.ceil(timeUntilReset / (1000 * 60 * 60)))
    const minutesUntilReset = Math.max(1, Math.ceil(timeUntilReset / (1000 * 60)))

    const resetText = hoursUntilReset >= 1
        ? `${hoursUntilReset} hour${hoursUntilReset !== 1 ? 's' : ''}`
        : `${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''}`

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-500">
                        <AlertTriangle className="h-5 w-5" />
                        <DialogTitle>Rate Limit Reached</DialogTitle>
                    </div>
                    <DialogDescription className="space-y-4 pt-4">
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-200 dark:border-amber-800">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                {message}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Resets in approximately {resetText}</span>
                        </div>

                        {showUpgrade && (
                            <div className="rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 border border-indigo-200 dark:border-indigo-800">
                                <div className="flex items-start gap-3">
                                    <Zap className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <h4 className="font-semibold text-sm">Upgrade to Pro for Higher Limits</h4>
                                        <ul className="text-xs space-y-1 text-muted-foreground">
                                            <li>✓ 10x more API requests per day</li>
                                            <li>✓ Priority processing queue</li>
                                            <li>✓ Use your own Groq API keys (unlimited)</li>
                                            <li>✓ Advanced AI models available</li>
                                        </ul>
                                        <Button asChild size="sm" className="w-full mt-2">
                                            <Link href="/dashboard/settings?tab=billing">
                                                Upgrade to Pro
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground pt-2 border-t">
                            <p className="font-medium mb-1">What you can do now:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Wait for the limit to reset</li>
                                {showUpgrade && <li>Upgrade to Pro for higher limits</li>}
                                <li>Add your own Groq API key in Settings (no limits!)</li>
                            </ul>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
