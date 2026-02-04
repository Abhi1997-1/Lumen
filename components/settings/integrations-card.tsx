"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2, Plus, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { disconnectIntegration } from "@/app/dashboard/settings/integrations-actions"
import Image from "next/image"

interface IntegrationsCardProps {
    initialStatus: {
        notion: boolean
        onenote: boolean
    }
}

export function IntegrationsCard({ initialStatus }: IntegrationsCardProps) {
    const [status, setStatus] = useState(initialStatus)
    const [loading, setLoading] = useState<string | null>(null)

    const handleConnect = async (provider: 'notion' | 'onenote') => {
        setLoading(provider)
        // Simulate OAuth flow for now as we don't have real Client IDs
        // In production, this would redirect to /api/auth/{provider}

        setTimeout(() => {
            toast.info(`${provider === 'notion' ? 'Notion' : 'OneNote'} integration requires OAuth credentials.`, {
                description: "This makes a placeholder connection for demo purposes."
            })
            // We can't actually insert into DB without a token, so we'll just show a toast helper
            // Or prompt user for input. For now, let's just show a "Contact Developer" or "Config Missing"

            setLoading(null)
            toast.warning("OAuth Configuration Missing", {
                description: "Please configure Client ID and Secret in settings."
            })
        }, 1000)
    }

    const handleDisconnect = async (provider: 'notion' | 'onenote') => {
        setLoading(provider)
        const result = await disconnectIntegration(provider)
        if (result.success) {
            setStatus(prev => ({ ...prev, [provider]: false }))
            toast.success(`Disconnected ${provider}`)
        } else {
            toast.error(`Failed to disconnect: ${result.error}`)
        }
        setLoading(null)
    }

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                    Connect your workspace to export notes and summaries.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Notion */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-accent/20">
                    <div className="flex items-center gap-4">
                        <div className="relative h-10 w-10 flex items-center justify-center bg-white rounded-lg border border-zinc-200">
                            {/* Placeholder Icon if no image */}
                            <span className="text-xl font-serif text-black font-bold">N</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">Notion</h3>
                                <div className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">Coming Soon</div>
                            </div>
                            <p className="text-sm text-muted-foreground">Export to pages and databases</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                        Connect
                    </Button>
                </div>

                {/* OneNote */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-accent/20">
                    <div className="flex items-center gap-4">
                        <div className="relative h-10 w-10 flex items-center justify-center bg-[#7719aa] rounded-lg border border-zinc-200">
                            <span className="text-xl font-sans text-white font-bold">N</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">OneNote</h3>
                                <div className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">Coming Soon</div>
                            </div>
                            <p className="text-sm text-muted-foreground">Sync with your notebooks</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                        Connect
                    </Button>
                </div>

            </CardContent>
        </Card>
    )
}
