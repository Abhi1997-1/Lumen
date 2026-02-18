"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Eye, EyeOff, Loader2, CheckCircle, Key, Zap, Sparkles, AlertCircle } from "lucide-react"
import { saveSettings } from "./actions"
import { togglePreferOwnKey } from "@/app/actions" // Removed testGeminiConnection for now or need to adapt it
import { toast } from "sonner"
import { ApiKeyHelpDialog } from '@/components/api-key-help-dialog'

interface SettingsFormProps {
    settings: {
        hasGeminiKey: boolean
        hasOpenAIKey: boolean
        hasGroqKey: boolean
        selectedProvider: string
        tier?: string
        isAdmin?: boolean
    }
}

// ... imports
export function SettingsForm({ settings }: SettingsFormProps) {
    // Only tracking Groq related status
    const [isLoading, setIsLoading] = useState(false)
    const [showKey, setShowKey] = useState(false)
    const [testStatus, setTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error', message?: string }>({ status: 'idle' })

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            await saveSettings(formData)
            toast.success("Settings saved successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to save settings")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleTest() {
        setTestStatus({ status: 'testing' })
        const input = document.getElementById(`groq_api_key`) as HTMLInputElement
        const apiKey = input?.value

        try {
            const { testConnection } = await import("./actions")
            const result = await testConnection('groq', apiKey)

            if (result.success) {
                setTestStatus({ status: 'success', message: 'Connection successful!' })
                toast.success(`Connected to Groq`)
            } else {
                setTestStatus({ status: 'error', message: result.error })
                toast.error(result.error || "Connection failed")
            }
        } catch (e) {
            setTestStatus({ status: 'error', message: 'Test failed' })
        }
    }

    return (
        <form action={handleSubmit} className="space-y-8">
            <input type="hidden" name="selected_provider" value="groq" />

            {/* GROQ CARD (Now the only one, presented as main status) */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Zap className="h-6 w-6 text-orange-500 fill-orange-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Groq AI</h3>
                            <p className="text-sm text-muted-foreground">Lightning fast transcription & analysis</p>
                        </div>
                    </div>
                    {settings.hasGroqKey ? (
                        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20">
                            <CheckCircle className="h-4 w-4" /> Connected
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-medium border border-amber-500/20">
                            <AlertCircle className="h-4 w-4" /> Not Connected
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="groq_api_key">Your Groq API Key</Label>
                            <ApiKeyHelpDialog provider="groq" />
                        </div>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <div className="absolute left-3 top-2.5 text-muted-foreground">
                                    <Key className="h-4 w-4" />
                                </div>
                                <Input
                                    id="groq_api_key" name="groq_api_key"
                                    type={showKey ? "text" : "password"}
                                    placeholder={settings.hasGroqKey ? "••••••••••••••••" : "gsk_..."}
                                    className="pl-9 pr-10"
                                />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowKey(!showKey)}>
                                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTest}
                                disabled={testStatus.status === 'testing'}
                            >
                                {testStatus.status === 'testing' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Key"}
                            </Button>
                        </div>
                        {testStatus.status === 'error' && <p className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {testStatus.message}</p>}
                        {testStatus.status === 'success' && <p className="text-sm text-emerald-500 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> {testStatus.message}</p>}
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto" size="lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
        </form>
    )
}
