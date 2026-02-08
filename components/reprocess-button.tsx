'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ModelSelector } from '@/components/model-selector'
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { reprocessMeeting } from './actions'
import { toast } from 'sonner'
import { RateLimitErrorDialog } from '@/components/rate-limit-error-dialog'

interface ReprocessButtonProps {
    meetingId: string
    currentModel?: string
    tier: string
}

export function ReprocessButton({ meetingId, currentModel, tier }: ReprocessButtonProps) {
    const [open, setOpen] = useState(false)
    const [selectedModel, setSelectedModel] = useState(currentModel || 'gemini-flash')
    const [loading, setLoading] = useState(false)
    const [rateLimitError, setRateLimitError] = useState<{
        message: string
        resetAt: Date
        show: boolean
    }>({ message: '', resetAt: new Date(), show: false })

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
                // Check if it's a rate limit error
                if (result.upgradePrompt && result.resetAt) {
                    setRateLimitError({
                        message: result.error || 'Rate limit exceeded',
                        resetAt: new Date(result.resetAt),
                        show: true
                    })
                    setOpen(false)
                } else {
                    toast.error(result.error || 'Reprocessing failed')
                }
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
                        Reprocess with Different Model
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reprocess Meeting</DialogTitle>
                        <DialogDescription>
                            Choose a different AI model to regenerate the transcript and analysis.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                This will replace your current transcript, summary, and insights with new results from the selected model.
                            </AlertDescription>
                        </Alert>

                        <ModelSelector
                            value={selectedModel}
                            onValueChange={setSelectedModel}
                            tier={tier}
                        />

                        {currentModel && (
                            <div className="text-xs text-muted-foreground">
                                Current model: <span className="font-medium">{currentModel}</span>
                            </div>
                        )}

                        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                            <p className="font-medium mb-1">💡 Tip:</p>
                            <ul className="text-xs space-y-1">
                                <li>• Try a more advanced model if quality isn't satisfactory</li>
                                <li>• Uses your original audio recording</li>
                                <li>• The original transcript will be replaced</li>
                            </ul>
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
                            disabled={loading || selectedModel === currentModel}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Reprocessing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reprocess Meeting
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
