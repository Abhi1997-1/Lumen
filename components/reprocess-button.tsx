"use client"

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
import { ModelSelector } from "@/components/model-selector" // Import
import { Label } from "@/components/ui/label"

interface ReprocessButtonProps {
    meetingId: string
    currentModel?: string
    tier?: string
}

export function ReprocessButton({ meetingId, currentModel, tier = 'free' }: ReprocessButtonProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile")
    const [rateLimitError, setRateLimitError] = useState<{
        message: string
        resetAt: Date
        show: boolean
    }>({ message: '', resetAt: new Date(), show: false })


    const handleReprocess = async () => {
        setLoading(true)
        try {
            // Updated to pass selectedModel
            const result = await reprocessMeeting(meetingId, selectedModel)

            if (result.success) {
                toast.success('Meeting reprocessed successfully!', {
                    description: 'The transcript has been regenerated with the new model.'
                })
                setOpen(false)
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
                            Regenerate transcript and analysis.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-amber-900 dark:text-amber-100">
                                This will replace your current transcript, summary, and insights.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label>Select AI Model</Label>
                            <ModelSelector value={selectedModel} onValueChange={setSelectedModel} />
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
