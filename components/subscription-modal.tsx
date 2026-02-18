"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Zap, Key, Sparkles, CreditCard, Rocket } from "lucide-react"
import { upgradeTier, purchaseCredits } from "@/app/actions"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface SubscriptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentTier: string;
    credits?: number;
}

const CREDIT_PACKS = [
    { id: 'starter', name: 'Starter', price: 3, credits: 200, popular: false },
    { id: 'standard', name: 'Standard', price: 5, credits: 500, popular: true },
    { id: 'value', name: 'Value', price: 10, credits: 1200, popular: false, bonus: '+20%' },
]

// Simplified models list - Just showing Groq capabilities generally
const AI_FEATURES = [
    { name: 'Llama 3.3 70B', desc: 'Deep Analysis & Reasoning', icon: Rocket, color: 'text-blue-500' },
    { name: 'Whisper Large v3', desc: 'Human-level Transcription', icon: Sparkles, color: 'text-purple-500' },
    { name: 'Ultra-Fast Inference', desc: 'Real-time Results', icon: Zap, color: 'text-yellow-500' },
]

export function SubscriptionModal({ open, onOpenChange, currentTier, credits = 0 }: SubscriptionModalProps) {
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'plans' | 'credits'>('plans')
    const router = useRouter()

    const handleUpgrade = async (tier: 'pro' | 'free') => {
        setLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 800))
            const res = await upgradeTier(tier)
            if (res.success) {
                toast.success(tier === 'pro' ? 'Welcome to Pro! 🎉 You have 1200 credits.' : 'Switched to Free plan')
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

    const handlePurchaseCredits = async (packId: string) => {
        setLoading(true)
        try {
            // Mock payment - replace with Stripe later
            await new Promise(resolve => setTimeout(resolve, 1000))
            const pack = CREDIT_PACKS.find(p => p.id === packId)
            if (!pack) throw new Error("Invalid pack")

            const res = await purchaseCredits(pack.credits, pack.price, packId)
            if (res.success) {
                toast.success(`Added ${pack.credits} credits! 🎉`)
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error(res.error || "Failed to purchase")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const isPro = currentTier === 'pro'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                        {isPro ? 'Manage Your Plan' : 'Upgrade to Pro'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        {isPro ? 'Buy more credits or manage your subscription' : 'Get 1200 credits/month with managed AI - no API key needed'}
                    </DialogDescription>
                </DialogHeader>

                {/* Tab Switcher */}
                <div className="flex justify-center gap-2 mt-2">
                    <Button
                        variant={activeTab === 'plans' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('plans')}
                        className="gap-2"
                    >
                        <Zap className="h-4 w-4" />
                        Plans
                    </Button>
                    <Button
                        variant={activeTab === 'credits' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('credits')}
                        className="gap-2"
                    >
                        <CreditCard className="h-4 w-4" />
                        Buy Credits
                    </Button>
                </div>

                {activeTab === 'plans' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Free Plan (BYOK) */}
                        <div className={cn(
                            "relative rounded-xl border p-4 flex flex-col transition-all",
                            currentTier === 'free'
                                ? "border-purple-500/50 bg-purple-500/5"
                                : "border-border hover:border-purple-500/30"
                        )}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Key className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Free (BYOK)</h3>
                                    <p className="text-xs text-muted-foreground">Bring Your Own Key</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <span className="text-3xl font-bold">$0</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>

                            <ul className="space-y-2 text-sm flex-1 mb-4">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-purple-500" />
                                    <span>Use your own Groq API key</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-purple-500" />
                                    <span>Unlimited usage (billed by Groq)</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-purple-500" />
                                    <span>Access to Llama 3 & Whisper</span>
                                </li>
                            </ul>

                            <Button
                                variant="outline"
                                className={cn(
                                    currentTier !== 'pro' && "border-purple-500/30 bg-purple-500/5"
                                )}
                                onClick={() => handleUpgrade('free')}
                                disabled={currentTier !== 'pro' || loading}
                            >
                                {currentTier !== 'pro' ? 'Current Plan' : 'Switch to Free'}
                            </Button>
                        </div>

                        {/* Pro Plan */}
                        <div className={cn(
                            "relative rounded-xl border-2 p-4 flex flex-col transition-all",
                            isPro
                                ? "border-indigo-500 bg-indigo-500/5"
                                : "border-indigo-500/50 hover:border-indigo-500 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"
                        )}>
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                                    Recommended
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="h-7 w-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-indigo-400 text-xs">Pro</h3>
                                    <p className="text-[9px] text-muted-foreground">Managed AI</p>
                                </div>
                            </div>

                            <div className="mb-2">
                                <span className="text-xl font-bold">$10</span>
                                <span className="text-muted-foreground text-[10px]">/mo</span>
                                <p className="text-[9px] text-indigo-400 mt-0.5">1200 credits/month</p>
                            </div>

                            <ul className="space-y-1 text-[11px] flex-1 mb-2">
                                <li className="flex items-center gap-1.5">
                                    <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                                    <span><b>No API key needed</b></span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <Check className="h-2.5 w-2.5 text-indigo-400" />
                                    <span>Premium AI Models Included</span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <Check className="h-2.5 w-2.5 text-indigo-400" />
                                    <span>Buy extra credits anytime</span>
                                </li>
                            </ul>

                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-8 text-xs"
                                onClick={() => handleUpgrade('pro')}
                                disabled={isPro || loading}
                            >
                                {isPro ? 'Current Plan' : (loading ? 'Processing...' : 'Upgrade to Pro')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Credit Packs */
                    <div className="mt-4">
                        <div className="text-center mb-4">
                            <p className="text-sm text-muted-foreground">
                                Current balance: <span className="font-bold text-foreground">{credits} credits</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {CREDIT_PACKS.map((pack) => (
                                <div
                                    key={pack.id}
                                    className={cn(
                                        "relative rounded-xl border p-4 text-center transition-all hover:border-primary/50 cursor-pointer",
                                        pack.popular && "border-primary bg-primary/5"
                                    )}
                                    onClick={() => !loading && handlePurchaseCredits(pack.id)}
                                >
                                    {pack.popular && (
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                                            <span className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                Popular
                                            </span>
                                        </div>
                                    )}
                                    {pack.bonus && (
                                        <div className="absolute -top-2 right-2">
                                            <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                                {pack.bonus}
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-2xl font-bold">${pack.price}</div>
                                    <div className="text-sm text-muted-foreground">{pack.credits} credits</div>
                                    <div className="text-[10px] text-muted-foreground mt-1">
                                        ~{pack.credits} min transcription
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-center text-muted-foreground mt-4">
                            Credits never expire • Works with or without subscription
                        </p>
                    </div>
                )}

                {/* AI Models / Features */}
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm mb-2">Powered by Groq AI:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        {AI_FEATURES.map((feature) => (
                            <div key={feature.name} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                                <feature.icon className={cn("h-4 w-4", feature.color)} />
                                <div className="flex flex-col">
                                    <span className="font-medium">{feature.name}</span>
                                    <span className="text-[10px] text-muted-foreground">{feature.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
