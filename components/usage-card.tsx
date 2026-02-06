"use client"

import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Key, AlertTriangle } from "lucide-react"
import { SubscriptionModal } from "@/components/subscription-modal"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface UsageCardProps {
    usedTokens: number;
    limitTokens: number;
    tier: string;
}

export function UsageCard({ usedTokens, limitTokens, tier }: UsageCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const router = useRouter()

    // Normalization logic:
    // If limitTokens is -1, it's unlimited.
    // If limitTokens > 0, it's a quota (e.g. Pro).
    // If limitTokens is 0 or undefined, maybe just show used.

    const isUnlimited = limitTokens === -1 || limitTokens >= 100000000 // Treat very high as unlimited for safety
    const isPro = tier === 'pro'
    // const isFree = tier === 'free' // Effectively BYOK now

    // NOTE: In the new model, "Free" without a key is basically unconnected.
    // We can infer "No Key" if limits are weird or just rely on passing a prop. 
    // For now, let's assume if it's NOT pro, it's BYOK. 
    // The parent passes "limit: -1" if key exists, or maybe "limit: 0" if no key? 
    // Let's look at `getMonthlyUsage`. It returns limit: 2M default. We need to change that.

    // Calculate percentage only if bounded
    const percentage = !isUnlimited && limitTokens > 0
        ? Math.min((usedTokens / limitTokens) * 100, 100)
        : 0

    // Format numbers
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "k"
        return num.toString()
    }

    return (
        <>
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-border/50 overflow-hidden relative shadow-lg">
                <div className="absolute inset-0 bg-grid-white/5 mask-image-b-0 pointer-events-none" />

                {/* Visual Flair for Pro */}
                {isPro && <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full -mr-10 -mt-10" />}

                <CardContent className="p-4 space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isPro ? (
                                <Sparkles className="h-4 w-4 text-indigo-400 fill-indigo-400" />
                            ) : (
                                <Key className="h-4 w-4 text-purple-400" />
                            )}
                            <span className="text-sm font-semibold text-white capitalize">
                                {isPro ? 'Pro Plan' : 'Standard Plan'}
                            </span>
                        </div>
                    </div>

                    {isPro ? (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-indigo-200">
                                <span>{formatNumber(usedTokens)}</span>
                                <span>{formatNumber(limitTokens)} Limit</span>
                            </div>
                            <Progress value={percentage} className="h-2 bg-indigo-950/50 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-purple-500" />
                        </div>
                    ) : (
                        // BYOK State
                        <div className="space-y-1">
                            {isUnlimited ? (
                                <div className="text-xs text-slate-300 flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    BYOK Active: Unlimited
                                </div>
                            ) : (
                                // No Key Detected (Fallthrough if limit is small)
                                // Actually, we should probably handle "No Key" better.
                                // If the server returns strict 0 limit for no-key users, we can show a warning.
                                <div className="text-xs text-orange-300 flex items-center gap-1.5 bg-orange-500/10 p-1.5 rounded-md border border-orange-500/20">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Setup Key to start</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 pt-1">
                        {!isPro && !isUnlimited && (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full bg-white/10 hover:bg-white/20 text-white border-0 h-7 text-xs font-medium"
                                onClick={() => router.push('/dashboard/settings')}
                            >
                                Add API Key
                            </Button>
                        )}
                        <Button
                            variant={isPro ? "outline" : "default"} // Invert style for emphasis
                            size="sm"
                            className={`w-full h-7 text-xs font-medium ${isPro ? "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                            onClick={() => setIsModalOpen(true)}
                        >
                            {isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <SubscriptionModal open={isModalOpen} onOpenChange={setIsModalOpen} currentTier={tier} />
        </>
    )
}
