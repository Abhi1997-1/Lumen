"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Zap, Users, Boxes, Key } from "lucide-react"
import { upgradeTier } from "@/app/actions"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface SubscriptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentTier: string;
}

export function SubscriptionModal({ open, onOpenChange, currentTier }: SubscriptionModalProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleUpgrade = async (tier: 'pro' | 'unlimited') => {
        setLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            const res = await upgradeTier(tier)
            if (res.success) {
                toast.success(`Successfully switched to ${tier === 'pro' ? 'Pro' : 'BYOK'}!`)
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error("Failed to update plan: " + res.error)
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">Choose Your Intelligence Model</DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        Select how you want to power Lumen's AI capabilities.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-3xl mx-auto w-full">
                    {/* BYOK Plan */}
                    <div className="relative rounded-2xl border border-border p-8 flex flex-col gap-4 hover:border-purple-500/50 transition-colors bg-card/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Key className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Standard (BYOK)</h3>
                                <p className="text-sm text-muted-foreground">Bring Your Own Key</p>
                            </div>
                        </div>

                        <div className="my-2">
                            <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                            <p className="text-xs text-muted-foreground mt-2">Plus Google API costs (usually free tier)</p>
                        </div>

                        <div className="border-t border-border/50 my-2" />

                        <ul className="space-y-3 text-sm flex-1">
                            <li className="flex items-center gap-2"><Check className="h-5 w-5 text-purple-500" /> <b>Unlimited</b> Processing Tokens</li>
                            <li className="flex items-center gap-2"><Check className="h-5 w-5 text-purple-500" /> Full Privacy Control</li>
                            <li className="flex items-center gap-2"><Check className="h-5 w-5 text-purple-500" /> Access to Latest Gemini Models</li>
                            <li className="flex items-center gap-2"><Check className="h-5 w-5 text-purple-500" /> Standard Support</li>
                        </ul>

                        <div className="flex flex-col gap-2 mt-4">
                            <Button
                                variant={currentTier !== 'pro' ? "outline" : "default"}
                                className={currentTier !== 'pro' ? "border-purple-500/20 bg-purple-500/5 text-purple-500 pointer-events-none" : "hover:bg-purple-600"}
                                onClick={() => handleUpgrade('unlimited')}
                                disabled={currentTier !== 'pro' || loading}
                            >
                                {currentTier !== 'pro' ? 'Current Plan' : 'Switch to BYOK'}
                            </Button>
                            {currentTier !== 'pro' && (
                                <Button variant="link" className="text-xs text-muted-foreground h-auto p-0" onClick={() => router.push('/dashboard/settings')}>
                                    Configure API Key
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Pro Plan */}
                    <div className="relative rounded-2xl border-2 border-indigo-500 bg-indigo-500/5 p-8 flex flex-col gap-4 shadow-2xl">
                        <div className="absolute -top-4 left-0 right-0 flex justify-center">
                            <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-lg shadow-indigo-600/20">Recommended</span>
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-indigo-400">Pro</h3>
                                <p className="text-sm text-indigo-200/70">Managed Intelligence</p>
                            </div>
                        </div>

                        <div className="my-2">
                            <div className="text-3xl font-bold">$19<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                            <p className="text-xs text-muted-foreground mt-2">Billed monthly. Cancel anytime.</p>
                        </div>

                        <div className="border-t border-border/50 my-2" />

                        <ul className="space-y-3 text-sm flex-1">
                            <li className="flex items-center gap-2"><Check className="h-5 w-5 text-indigo-400" /> <b>Managed</b> API Access (No Key Needed)</li>
                            <li className="flex items-center gap-2"><Check className="h-5 w-5 text-indigo-400" /> <b>Team workspaces</b> for collaboration</li>
                            <li className="flex items-center gap-2"><Check className="h-5 w-5 text-indigo-400" /> <b>Unlimited</b> History Retention</li>
                            <li className="flex items-center gap-2"><Boxes className="h-4 w-4 text-indigo-400 ml-0.5 mr-0.5" /> Integrations (Slack, Notion, Trello)</li>
                            <li className="flex items-center gap-2"><Users className="h-4 w-4 text-indigo-400 ml-0.5 mr-0.5" /> Advanced Speaker Identification</li>
                        </ul>

                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4 h-11"
                            onClick={() => handleUpgrade('pro')}
                            disabled={loading || currentTier === 'pro'}
                        >
                            {currentTier === 'pro' ? 'Current Plan' : (loading ? 'Processing...' : 'Upgrade to Pro')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
