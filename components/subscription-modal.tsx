"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
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
            // Mock payment delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            const res = await upgradeTier(tier)
            if (res.success) {
                toast.success(`Successfully upgraded to ${tier === 'pro' ? 'Pro' : 'Unlimited'}!`)
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error("Failed to upgrade: " + res.error)
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">Choose Your Plan</DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        Unlock more processing power and advanced features.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {/* Free Tier */}
                    <div className="relative rounded-2xl border border-border p-6 flex flex-col gap-4 hover:border-indigo-500/50 transition-colors">
                        <div>
                            <h3 className="text-lg font-semibold">Free</h3>
                            <div className="mt-2 text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                            <p className="text-sm text-muted-foreground mt-2">Perfect for trying it out.</p>
                        </div>
                        <ul className="space-y-2 text-sm flex-1">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 2,000,000 Tokens/mo</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Standard Processing</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 3-Day History</li>
                        </ul>
                        <Button variant="outline" disabled={currentTier === 'free'} className="w-full">
                            {currentTier === 'free' ? 'Current Plan' : 'Downgrade'}
                        </Button>
                    </div>

                    {/* Pro Tier */}
                    <div className="relative rounded-2xl border-2 border-indigo-500 bg-indigo-500/5 p-6 flex flex-col gap-4 shadow-xl">
                        <div className="absolute -top-3 left-0 right-0 flex justify-center">
                            <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-indigo-400">Pro</h3>
                            <div className="mt-2 text-3xl font-bold">$19<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                            <p className="text-sm text-muted-foreground mt-2">For power users & teams.</p>
                        </div>
                        <ul className="space-y-2 text-sm flex-1">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-500" /> 10,000,000 Tokens/mo</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-500" /> Priority Processing</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-500" /> Unlimited History</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-500" /> Advanced AI Analysis</li>
                        </ul>
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => handleUpgrade('pro')}
                            disabled={loading || currentTier === 'pro'}
                        >
                            {currentTier === 'pro' ? 'Current Plan' : (loading ? 'Processing...' : 'Upgrade Now')}
                        </Button>
                    </div>

                    {/* Unlimited / BYOK */}
                    <div className="relative rounded-2xl border border-border p-6 flex flex-col gap-4 hover:border-purple-500/50 transition-colors">
                        <div>
                            <h3 className="text-lg font-semibold">Enterprise / BYOK</h3>
                            <div className="mt-2 text-3xl font-bold">Custom<span className="text-sm font-normal text-muted-foreground">/key</span></div>
                            <p className="text-sm text-muted-foreground mt-2">Use your own Gemini API Key.</p>
                        </div>
                        <ul className="space-y-2 text-sm flex-1">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-500" /> Unlimited Tokens</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-500" /> Highest Privacy</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-500" /> No Rate Limits</li>
                        </ul>
                        <Button
                            variant="outline"
                            className="w-full border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10"
                            onClick={() => router.push('/dashboard/settings')}
                        >
                            Configure API Key
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
