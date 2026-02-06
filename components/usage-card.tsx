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
            <Card className="bg-card border-border overflow-hidden relative shadow-sm">

                {/* Visual Flair for Pro (Subtler) */}
                {isPro && <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 blur-xl rounded-full -mr-8 -mt-8" />}

                <CardContent className="p-3 space-y-2 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isPro ? (
                                <Sparkles className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500" />
                            ) : (
                                <Key className="h-3.5 w-3.5 text-purple-500" />
                            )}
                            <span className="text-xs font-semibold text-foreground capitalize">
                                {isPro ? 'Pro Plan' : 'Standard Plan'}
                            </span>
                        </div>
                    </div>

                    {isPro ? (
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{formatNumber(usedTokens)}</span>
                                <span>{formatNumber(limitTokens)} Limit</span>
                            </div>
                            <Progress value={percentage} className="h-1.5 bg-secondary [&>div]:bg-indigo-500" />
                        </div>
                    ) : (
                        // BYOK State
                        <div className="space-y-1">
                            {isUnlimited ? (
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    BYOK Active
                                </div>
                            ) : (
                                <div className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1.5 bg-orange-500/10 p-1 rounded border border-orange-500/20">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Setup Key</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-1.5 pt-1">
                        {!isPro && !isUnlimited && (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border-0 h-7 text-xs font-medium"
                                onClick={() => router.push('/dashboard/settings')}
                            >
                                Add API Key
                            </Button>
                        )}
                        <Button
                            variant={isPro ? "outline" : "default"}
                            size="sm"
                            className={`w-full h-7 text-xs font-medium ${isPro ? "bg-background hover:bg-accent text-foreground border-input" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                            onClick={() => setIsModalOpen(true)}
                        >
                            {isPro ? 'Manage' : 'Upgrade'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <SubscriptionModal open={isModalOpen} onOpenChange={setIsModalOpen} currentTier={tier} />
        </>
    )
}
