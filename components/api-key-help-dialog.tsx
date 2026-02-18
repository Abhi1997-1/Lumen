"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Unused
import { HelpCircle, ExternalLink, Copy, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ApiKeyHelpDialogProps {
    provider?: 'gemini' | 'openai' | 'groq'
}

export function ApiKeyHelpDialog({ provider = 'gemini' }: ApiKeyHelpDialogProps) {
    const [open, setOpen] = useState(false)
    const [copiedStep, setCopiedStep] = useState<string | null>(null)

    const copyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        setCopiedStep(label)
        toast.success("Copied to clipboard!")
        setTimeout(() => setCopiedStep(null), 2000)
    }

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                className="text-primary hover:text-primary/80 h-auto p-0 text-xs"
            >
                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                How to get API key?
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">How to Get Your AI API Key</DialogTitle>
                        <DialogDescription>
                            Follow these simple steps to get your free API key and start transcribing
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                                Sign Up for Groq
                            </h4>
                            <p className="text-sm text-muted-foreground ml-8">
                                Go to <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                    console.groq.com <ExternalLink className="h-3 w-3" />
                                </a> and create an account
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">2</span>
                                Access API Keys
                            </h4>
                            <p className="text-sm text-muted-foreground ml-8">
                                Find <strong>"API Keys"</strong> in the left sidebar and click it
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">3</span>
                                Create API Key
                            </h4>
                            <p className="text-sm text-muted-foreground ml-8">
                                Click <strong>"Create API Key"</strong>, name it "Lumen", and submit
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">4</span>
                                Copy Your Key
                            </h4>
                            <p className="text-sm text-muted-foreground ml-8">
                                Copy the generated key and paste it in the field above
                            </p>
                            <div className="ml-8 mt-2 p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded text-xs flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                <span className="text-yellow-900 dark:text-yellow-100">
                                    Keep your API key private. Never share it publicly.
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <a
                                href="https://console.groq.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button className="w-full" variant="outline">
                                    Open Groq Console <ExternalLink className="ml-2 h-4 w-4" />
                                </Button>
                            </a>
                        </div>
                    </div>

                    <div className="pt-4 border-t text-xs text-muted-foreground">
                        <p>💡 <strong>Tip:</strong> Google AI Studio offers the most generous free tier and is perfect for getting started.</p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
