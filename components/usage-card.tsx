"use client"

import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Key, AlertTriangle, X, Coins } from "lucide-react"
import { SubscriptionModal } from "@/components/subscription-modal"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface UsageCardProps {
    credits: number;
    tier: string;
    hasApiKey: boolean;
}

export function UsageCard({ credits, tier, hasApiKey }: UsageCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (localStorage.getItem("usage_card_minimized") === "true") {
            setIsMinimized(true)
        }
    }, [])

    const isPro = tier === 'pro'
    const isByok = hasApiKey && !isPro

    const handleMinimize = () => {
        setIsMinimized(true)
        localStorage.setItem("usage_card_minimized", "true")
    }

    // Get label for tier
    const getTierLabel = () => {
        if (isPro) return 'Pro Plan'
        if (isByok) return 'BYOK'
        return 'Free'
    }

    if (isMinimized) {
        return (
            <>
                <Card className="bg-card border-border overflow-hidden relative shadow-sm group">
                    <CardContent className="p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isPro ? (
                                <Sparkles className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500" />
                            ) : isByok ? (
                                <Key className="h-3.5 w-3.5 text-purple-500" />
                            ) : (
                                <Coins className="h-3.5 w-3.5 text-amber-500" />
                            )}
                            <span className="text-xs font-semibold text-foreground">
                                {getTierLabel()}
                            </span>
                        </div>
                        <Button
                            variant={isPro ? "outline" : "default"}
                            size="sm"
                            className={`h-6 text-[10px] px-2 font-medium ${isPro ? "bg-background hover:bg-accent text-foreground border-input" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                            onClick={() => setIsModalOpen(true)}
                        >
                            {isPro ? 'Manage' : isByok ? 'View Plans' : 'Upgrade'}
                        </Button>
                    </CardContent>
                </Card>
                <SubscriptionModal open={isModalOpen} onOpenChange={setIsModalOpen} currentTier={tier} credits={credits} />
            </>
        )
    }

    return (
        <>
            <Card className="bg-card border-border overflow-hidden relative shadow-sm group">
                {/* Visual Flair for Pro */}
                {isPro && <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 blur-xl rounded-full -mr-8 -mt-8" />}

                <CardContent className="p-3 space-y-2 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isPro ? (
                                <Sparkles className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500" />
                            ) : isByok ? (
                                <Key className="h-3.5 w-3.5 text-purple-500" />
                            ) : (
                                <Coins className="h-3.5 w-3.5 text-amber-500" />
                            )}
                            <span className="text-xs font-semibold text-foreground capitalize">
                                {getTierLabel()}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 -mr-1 -mt-1 text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleMinimize}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>

                    {isPro ? (
                        // Pro Plan - Show credits
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Coins className="h-3 w-3" />
                                    {credits} / 1200 credits
                                </span>
                                <span>~{credits} min</span>
                            </div>
                            <Progress value={Math.min(100, (credits / 1200) * 100)} className="h-1.5 bg-secondary [&>div]:bg-indigo-500" />
                            <p className="text-[9px] text-muted-foreground">Resets monthly • 1 credit ≈ 1 min</p>
                        </div>
                    ) : isByok ? (
                        // BYOK - Show status
                        <div className="space-y-1">
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Using your API key
                            </div>
                            <p className="text-[9px] text-muted-foreground">Billed directly by provider</p>
                        </div>
                    ) : (
                        // Free - No API key set up
                        <div className="space-y-1">
                            <div className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1.5 bg-orange-500/10 p-1.5 rounded border border-orange-500/20">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Add API key or upgrade to transcribe</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-1.5 pt-1">
                        {!isPro && !isByok && (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border-0 h-7 text-xs font-medium"
                                onClick={() => router.push('/dashboard/settings')}
                            >
                                <Key className="h-3 w-3 mr-1.5" />
                                Add API Key
                            </Button>
                        )}
                        <Button
                            variant={isPro ? "outline" : "default"}
                            size="sm"
                            className={`w-full h-7 text-xs font-medium ${isPro ? "bg-background hover:bg-accent text-foreground border-input" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                            onClick={() => setIsModalOpen(true)}
                        >
                            {isPro ? (credits < 200 ? 'Buy Credits' : 'Manage Plan') : isByok ? 'View Plans' : 'Upgrade to Pro'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <SubscriptionModal open={isModalOpen} onOpenChange={setIsModalOpen} currentTier={tier} credits={credits} />
        </>
    )
}
