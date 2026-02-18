'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { reprocessMeeting } from '@/app/dashboard/meetings/[id]/actions'
import { toast } from 'sonner'
import { RateLimitErrorDialog } from '@/components/rate-limit-error-dialog'

interface ReprocessButtonProps {
    meetingId: string
    currentModel?: string
    tier?: string
}

export function ReprocessButton({ meetingId, currentModel, tier = 'free' }: ReprocessButtonProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [rateLimitError, setRateLimitError] = useState<{
        message: string
        resetAt: Date
        show: boolean
    }>({ message: '', resetAt: new Date(), show: false })

    // Always default to the best Groq model
    const selectedModel = 'llama-3.3-70b-versatile'

    const handleReprocess = async () => {
        setLoading(true)
        try {
            const result = await reprocessMeeting(meetingId, selectedModel)

            if (result.success) {
                toast.success('Meeting reprocessed successfully!', {
                    description: 'The transcript has been regenerated with the new model.'
                })
                setOpen(false)
                // Reload the page to show new results
                window.location.reload()
            } else {
                toast.error(result.error || 'Reprocessing failed')
            }
        } catch (error) {
            console.error('Reprocess error:', error)
            toast.error('An error occurred during reprocessing')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Reprocess
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reprocess Meeting</DialogTitle>
                        <DialogDescription>
                            Regenerate transcript and analysis using the latest Groq AI model.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-amber-900 dark:text-amber-100">
                                This will replace your current transcript, summary, and insights.
                            </p>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm font-medium">Model</span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Llama 3.3 70B (Groq)
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReprocess}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Reprocessing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Confirm Reprocess
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rate Limit Error Dialog */}
            <RateLimitErrorDialog
                open={rateLimitError.show}
                onClose={() => setRateLimitError({ ...rateLimitError, show: false })}
                message={rateLimitError.message}
                resetAt={rateLimitError.resetAt}
                showUpgrade={tier === 'free'}
            />
        </>
    )
}
