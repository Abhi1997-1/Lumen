"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Eye, EyeOff, Loader2, CheckCircle, Key, Zap, Sparkles } from "lucide-react"
import { saveSettings } from "./actions"
import { togglePreferOwnKey } from "@/app/actions" // Removed testGeminiConnection for now or need to adapt it
import { toast } from "sonner"

interface SettingsFormProps {
    settings: {
        hasGeminiKey: boolean
        hasOpenAIKey: boolean
        hasGroqKey: boolean
        selectedProvider: string
        preferOwnKey?: boolean
        tier?: string
        isAdmin?: boolean
    }
}

export function SettingsForm({ settings }: SettingsFormProps) {
    const [selectedProvider, setSelectedProvider] = useState(settings.selectedProvider)
    const [isLoading, setIsLoading] = useState(false)
    const [showKey, setShowKey] = useState<Record<string, boolean>>({})
    const [testStatus, setTestStatus] = useState<Record<string, { status: 'idle' | 'testing' | 'success' | 'error', message?: string }>>({})

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

    async function handleTest(provider: string) {
        setTestStatus(prev => ({ ...prev, [provider]: { status: 'testing' } }))

        // We need to get the current value from the input. 
        // Since we are using uncontrolled inputs for security (not storing key in state if possible), 
        // we might validly test 'saved' keys if the input is empty.
        // However, for a better UX, we should probably grab the value if the user just typed it.
        // But referencing the ref or input ID is simplest here.
        const input = document.getElementById(`${provider}_api_key`) as HTMLInputElement
        const apiKey = input?.value

        try {
            const { testConnection } = await import("./actions")
            const result = await testConnection(provider, apiKey)

            if (result.success) {
                setTestStatus(prev => ({ ...prev, [provider]: { status: 'success', message: 'Connection successful!' } }))
                toast.success(`Connected to ${provider.charAt(0).toUpperCase() + provider.slice(1)}`)
            } else {
                setTestStatus(prev => ({ ...prev, [provider]: { status: 'error', message: result.error } }))
                toast.error(result.error || "Connection failed")
            }
        } catch (e) {
            setTestStatus(prev => ({ ...prev, [provider]: { status: 'error', message: 'Test failed' } }))
        }
    }

    const toggleKey = (provider: string) => {
        setShowKey(prev => ({ ...prev, [provider]: !prev[provider] }))
    }

    const [preferOwnKey, setPreferOwnKey] = useState(settings.preferOwnKey || false)
    const [togglingPro, setTogglingPro] = useState(false)

    const handleProToggle = async (checked: boolean) => {
        setTogglingPro(true)
        try {
            const result = await togglePreferOwnKey(checked)
            if (result.success) {
                setPreferOwnKey(checked)
                toast.success(checked ? "Using your API Key" : "Using your Pro Credits")
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Failed to update preference")
        } finally {
            setTogglingPro(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="selected_provider" value={selectedProvider} />

            {/* PRO SETTINGS Banner */}
            {(settings.tier === 'pro' || settings.isAdmin) && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Pro / Admin Mode</h3>
                            <p className="text-sm text-muted-foreground">Manage how your requests are processed.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-background p-2 rounded-lg border shadow-sm">
                        <span className="text-xs font-medium text-muted-foreground">Use my own keys</span>
                        <Switch
                            checked={preferOwnKey}
                            onCheckedChange={handleProToggle}
                            disabled={togglingPro}
                        />
                    </div>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                {/* GEMINI CARD */}
                <div
                    className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-primary ${selectedProvider === 'gemini' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'}`}
                    onClick={() => setSelectedProvider('gemini')}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-500" />
                            <span className="font-semibold">Gemini</span>
                        </div>
                        {selectedProvider === 'gemini' && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Free & Standard. Best all-rounder.</p>
                    {settings.hasGeminiKey ? (
                        <div className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Connected
                        </div>
                    ) : (
                        <div className="text-xs text-amber-500">Not Connected</div>
                    )}
                </div>

                {/* GROQ CARD */}
                <div
                    className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-primary ${selectedProvider === 'groq' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'}`}
                    onClick={() => setSelectedProvider('groq')}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-orange-500 fill-orange-500" />
                            <span className="font-semibold">Groq</span>
                        </div>
                        {selectedProvider === 'groq' && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Lightning Fast. Free tier available.</p>
                    {settings.hasGroqKey ? (
                        <div className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Connected
                        </div>
                    ) : (
                        <div className="text-xs text-amber-500">Not Connected</div>
                    )}
                </div>

                {/* OPENAI CARD */}
                <div
                    className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-primary ${selectedProvider === 'openai' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'}`}
                    onClick={() => setSelectedProvider('openai')}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-green-600" />
                            <span className="font-semibold">OpenAI</span>
                        </div>
                        {selectedProvider === 'openai' && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Premium Quality (GPT-4o). Paid.</p>
                    {settings.hasOpenAIKey ? (
                        <div className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Connected
                        </div>
                    ) : (
                        <div className="text-xs text-amber-500">Not Connected</div>
                    )}
                </div>
            </div>

            <div className="space-y-6 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground">API Configuration</h3>

                {/* GEMINI INPUT */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="gemini_api_key">Gemini API Key</Label>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Get Key form Google AI Studio <span className="sr-only">(opens in new tab)</span>
                        </a>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-2.5 text-muted-foreground">
                                <Key className="h-4 w-4" />
                            </div>
                            <Input
                                id="gemini_api_key" name="gemini_api_key"
                                type={showKey['gemini'] ? "text" : "password"}
                                placeholder={settings.hasGeminiKey ? "••••••••" : "Paste Key"}
                                className="pl-9 pr-10"
                            />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => toggleKey('gemini')}>
                                {showKey['gemini'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleTest('gemini')}
                            disabled={testStatus['gemini']?.status === 'testing'}
                        >
                            {testStatus['gemini']?.status === 'testing' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                        </Button>
                    </div>
                    {testStatus['gemini']?.status === 'error' && (
                        <div className="text-xs text-destructive mt-1">
                            {(testStatus['gemini']?.message || "").includes('404')
                                ? "Error: Model not found. Ensure 'Generative Language API' is enabled in your Google Cloud Console."
                                : testStatus['gemini']?.message}
                        </div>
                    )}
                    {testStatus['gemini']?.status === 'success' && <p className="text-xs text-emerald-500 mt-1">{testStatus['gemini'].message}</p>}
                </div>

                {/* GROQ INPUT */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="groq_api_key">Groq API Key</Label>
                        <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Get Key from Groq Console
                        </a>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-2.5 text-muted-foreground">
                                <Key className="h-4 w-4" />
                            </div>
                            <Input
                                id="groq_api_key" name="groq_api_key"
                                type={showKey['groq'] ? "text" : "password"}
                                placeholder={settings.hasGroqKey ? "••••••••" : "Paste Key"}
                                className="pl-9 pr-10"
                            />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => toggleKey('groq')}>
                                {showKey['groq'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleTest('groq')}
                            disabled={testStatus['groq']?.status === 'testing'}
                        >
                            {testStatus['groq']?.status === 'testing' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                        </Button>
                    </div>
                    {testStatus['groq']?.status === 'error' && <p className="text-xs text-destructive">{testStatus['groq'].message}</p>}
                    {testStatus['groq']?.status === 'success' && <p className="text-xs text-emerald-500">{testStatus['groq'].message}</p>}
                </div>

                {/* OPENAI INPUT */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="openai_api_key">OpenAI API Key</Label>
                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Get Key from OpenAI Platform
                        </a>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-2.5 text-muted-foreground">
                                <Key className="h-4 w-4" />
                            </div>
                            <Input
                                id="openai_api_key" name="openai_api_key"
                                type={showKey['openai'] ? "text" : "password"}
                                placeholder={settings.hasOpenAIKey ? "••••••••" : "Paste Key"}
                                className="pl-9 pr-10"
                            />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => toggleKey('openai')}>
                                {showKey['openai'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleTest('openai')}
                            disabled={testStatus['openai']?.status === 'testing'}
                        >
                            {testStatus['openai']?.status === 'testing' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                        </Button>
                    </div>
                    {testStatus['openai']?.status === 'error' && <p className="text-xs text-destructive">{testStatus['openai'].message}</p>}
                    {testStatus['openai']?.status === 'success' && <p className="text-xs text-emerald-500">{testStatus['openai'].message}</p>}
                </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
        </form>
    )
}
