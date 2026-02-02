"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2, CheckCircle, Key, Zap } from "lucide-react"
import { saveSettings, testGeminiConnection } from "./actions"
import { toast } from "sonner"

interface SettingsFormProps {
    hasKey: boolean
}

export function SettingsForm({ hasKey }: SettingsFormProps) {
    const [showKey, setShowKey] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [keySaved, setKeySaved] = useState(hasKey)
    const [apiKey, setApiKey] = useState("")

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            await saveSettings(formData)
            setKeySaved(true)
            toast.success("Settings saved successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to save settings")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleTest() {
        setIsTesting(true)
        try {
            const result = await testGeminiConnection(apiKey)
            if (result.success) {
                toast.success("Connection verified! API Key is valid.", {
                    description: `Source: ${result.source || 'provided'}`
                })
            } else {
                toast.error("Connection failed", {
                    description: result.error
                })
            }
        } catch (e) {
            toast.error("Test failed unexpectedly")
        } finally {
            setIsTesting(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="gemini_api_key">Google Gemini API Key</Label>
                    {keySaved && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Active</span>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <Key className="h-4 w-4" />
                    </div>
                    <Input
                        id="gemini_api_key"
                        name="gemini_api_key"
                        type={showKey ? "text" : "password"}
                        placeholder={keySaved ? "••••••••••••••••" : "Enter your API Key"}
                        className="pl-9 pr-10 font-mono"
                        disabled={isLoading}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowKey(!showKey)}
                    >
                        {showKey ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                            {showKey ? "Hide API Key" : "Show API Key"}
                        </span>
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Required for meeting transcription and summarization.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={isLoading} className={keySaved ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : keySaved ? (
                        "Update Key"
                    ) : (
                        "Save Changes"
                    )}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    disabled={isTesting || (!apiKey && !keySaved)}
                    onClick={handleTest}
                    className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
                >
                    {isTesting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Zap className="mr-2 h-4 w-4" />
                    )}
                    Test Connection
                </Button>
            </div>
        </form>
    )
}
