"use client"

import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { SubscriptionModal } from "@/components/subscription-modal"
import { useState } from "react"

interface UsageCardProps {
    usedTokens: number;
    limitTokens: number;
    tier: string;
}

export function UsageCard({ usedTokens, limitTokens, tier }: UsageCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const percentage = Math.min((usedTokens / limitTokens) * 100, 100)

    // Format numbers (e.g. 1,200,000)
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "k"
        return num.toString()
    }

    const isUnlimited = limitTokens === -1

    return (
        <>
            <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/30 overflow-hidden relative">
                <div className="absolute inset-0 bg-grid-white/5 mask-image-b-0 pointer-events-none" />
                <CardContent className="p-4 space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-semibold text-white capitalize">{tier} Plan</span>
                        </div>
                    </div>

                    {!isUnlimited && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-indigo-200">
                                <span>{formatNumber(usedTokens)} used</span>
                                <span>{formatNumber(limitTokens)} limit</span>
                            </div>
                            <Progress value={percentage} className="h-2 bg-indigo-950/50 [&>div]:bg-gradient-to-r [&>div]:from-indigo-400 [&>div]:to-purple-400" />
                        </div>
                    )}

                    {isUnlimited && (
                        <p className="text-xs text-indigo-200">Unlimited processing enabled via custom API Key.</p>
                    )}

                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full bg-white/10 hover:bg-white/20 text-white border-0 h-8 text-xs font-medium"
                        onClick={() => setIsModalOpen(true)}
                    >
                        {tier === 'free' ? 'Upgrade to Pro' : 'Manage Subscription'}
                    </Button>
                </CardContent>
            </Card>

            <SubscriptionModal open={isModalOpen} onOpenChange={setIsModalOpen} currentTier={tier} />
        </>
    )
}
