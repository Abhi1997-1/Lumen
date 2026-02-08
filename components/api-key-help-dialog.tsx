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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

                    <Tabs defaultValue={provider} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="gemini">Google AI ⭐</TabsTrigger>
                            <TabsTrigger value="openai">OpenAI</TabsTrigger>
                            <TabsTrigger value="groq">Groq</TabsTrigger>
                        </TabsList>

                        {/* Google AI Studio Tab */}
                        <TabsContent value="gemini" className="space-y-4 mt-4">
                            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                <p className="text-sm text-green-900 dark:text-green-100 font-medium">
                                    ⭐ Recommended - Free & Easy Setup
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                    Generous free tier with excellent quality transcriptions
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                                        Visit Google AI Studio
                                    </h4>
                                    <p className="text-sm text-muted-foreground ml-8">
                                        Go to <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                            aistudio.google.com <ExternalLink className="h-3 w-3" />
                                        </a> and sign in with your Google account
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">2</span>
                                        Get API Key
                                    </h4>
                                    <p className="text-sm text-muted-foreground ml-8">
                                        Click the <strong>"Get API Key"</strong> button in the top-right corner
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">3</span>
                                        Create API Key
                                    </h4>
                                    <p className="text-sm text-muted-foreground ml-8">
                                        Select <strong>"Create API key in new project"</strong>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">4</span>
                                        Copy Your Key
                                    </h4>
                                    <p className="text-sm text-muted-foreground ml-8">
                                        Copy the generated key (starts with <code className="bg-muted px-1 py-0.5 rounded text-xs">AIzaSy...</code>) and paste it in the field above
                                    </p>
                                    <div className="ml-8 mt-2 p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded text-xs flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-yellow-900 dark:text-yellow-100">
                                            Keep your API key private. Never share it publicly or commit it to code repositories.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <a
                                    href="https://aistudio.google.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full"
                                >
                                    <Button className="w-full" variant="outline">
                                        Open Google AI Studio <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                </a>
                            </div>
                        </TabsContent>

                        {/* OpenAI Tab */}
                        <TabsContent value="openai" className="space-y-4 mt-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                                        Create OpenAI Account
                                    </h4>
                                    <p className="text-sm text-muted-foreground ml-8">
                                        Go to <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                            platform.openai.com/signup <ExternalLink className="h-3 w-3" />
                                        </a> and create an account
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">2</span>
                                        Navigate to API Keys
                                    </h4>
                                    <p className="text-sm text-muted-foreground ml-8">
                                        Click your profile → "View API keys" or go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                            platform.openai.com/api-keys <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">3</span>
                                        Create New Secret Key
                                    </h4>
                                    <p className="text-sm text-muted-foreground ml-8">
                                        Click <strong>"+ Create new secret key"</strong>, name it "Lumen", and create
                                    </p>
                                    <div className="ml-8 mt-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-xs flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-red-900 dark:text-red-100">
                                            <strong>Important:</strong> Copy immediately! The key is only shown once.
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">4</span>
                                        Save Your Key
                                    </h4>
                                    <p className="text-sm text-muted-foreground ml-8">
                                        Copy the key (starts with <code className="bg-muted px-1 py-0.5 rounded text-xs">sk-...</code>) and paste it above
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <a
                                    href="https://platform.openai.com/api-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full"
                                >
                                    <Button className="w-full" variant="outline">
                                        Open OpenAI Platform <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                </a>
                            </div>
                        </TabsContent>

                        {/* Groq Tab */}
                        <TabsContent value="groq" className="space-y-4 mt-4">
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
                        </TabsContent>
                    </Tabs>

                    <div className="pt-4 border-t text-xs text-muted-foreground">
                        <p>💡 <strong>Tip:</strong> Google AI Studio offers the most generous free tier and is perfect for getting started.</p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
