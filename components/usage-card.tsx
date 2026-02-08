"use client"

import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Key, AlertTriangle, X, Coins, CreditCard } from "lucide-react"
import { SubscriptionModal } from "@/components/subscription-modal"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
    // BYOK is active if hasApiKey AND !isPro
    const isByokEffectively = hasApiKey && !isPro

    // Label logic
    const getTierLabel = () => {
        if (isPro) return 'Pro Plan'
        if (hasApiKey) return 'BYOK'
        return 'Free'
    }

    const handleMinimize = () => {
        setIsMinimized(true)
        localStorage.setItem("usage_card_minimized", "true")
    }

    if (isMinimized) {
        return (
            <>
                <Card className="bg-card border-border overflow-hidden relative shadow-sm group">
                    <CardContent className="p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsMinimized(false)}>
                            {isPro ? (
                                <Sparkles className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500" />
                            ) : hasApiKey ? (
                                <Key className="h-3.5 w-3.5 text-purple-500" />
                            ) : (
                                <Coins className="h-3.5 w-3.5 text-amber-500" />
                            )}
                            <div className="flex flex-col items-start">
                                <span className="text-xs font-semibold text-foreground">
                                    {getTierLabel()}
                                </span>
                                {isPro && (
                                    <span className="text-[10px] text-muted-foreground">
                                        {credits} credits
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            variant={isPro ? "outline" : "default"}
                            size="sm"
                            className={`h-6 text-[10px] px-2 font-medium ${isPro ? "bg-background hover:bg-accent text-foreground border-input" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                            onClick={() => setIsModalOpen(true)}
                        >
                            {isPro ? 'Manage' : hasApiKey ? 'View Plans' : 'Upgrade'}
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
                {isPro && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 blur-xl rounded-full -mr-6 -mt-6" />}

                <CardContent className="p-2.5 space-y-2 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            {isPro ? (
                                <Sparkles className="h-3 w-3 text-indigo-500 fill-indigo-500" />
                            ) : hasApiKey ? (
                                <Key className="h-3 w-3 text-purple-500" />
                            ) : (
                                <Coins className="h-3 w-3 text-amber-500" />
                            )}
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                                    {getTierLabel()}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 -mr-1 -mt-1 text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleMinimize}
                        >
                            <X className="h-2.5 w-2.5" />
                        </Button>
                    </div>

                    {isPro ? (
                        // Pro Plan - Show credits
                        <div className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push('/dashboard/settings?tab=billing')}>
                            <div className="flex justify-between text-[9px] text-muted-foreground font-medium">
                                <span>{credits} / 1200</span>
                                <span>{Math.round((credits / 1200) * 100)}%</span>
                            </div>
                            <Progress value={Math.min(100, (credits / 1200) * 100)} className="h-1 bg-secondary [&>div]:bg-indigo-500" />
                        </div>
                    ) : hasApiKey ? (
                        // BYOK
                        <div className="space-y-0.5">
                            <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                Custom Key Active
                            </div>
                        </div>
                    ) : (
                        // Free - No API key set up
                        <div className="space-y-1">
                            <p className="text-[9px] text-orange-600/90 leading-tight">
                                Limit reached. Add key to continue.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-1 pt-0.5">
                        {!isPro && !hasApiKey && (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full bg-secondary/50 hover:bg-secondary text-secondary-foreground border-0 h-6 text-[9px] font-medium"
                                onClick={() => router.push('/dashboard/settings')}
                            >
                                <Key className="h-2.5 w-2.5 mr-1" />
                                Add Key
                            </Button>
                        )}
                        <Button
                            variant={isPro ? "outline" : "default"}
                            size="sm"
                            className={`w-full h-6 text-[9px] font-medium ${isPro ? "bg-background/50 hover:bg-accent text-foreground border-input" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"}`}
                            onClick={() => setIsModalOpen(true)}
                        >
                            {isPro ? (credits < 200 ? 'Buy Credits' : 'Manage') : hasApiKey ? 'Plans' : 'Upgrade'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <SubscriptionModal open={isModalOpen} onOpenChange={setIsModalOpen} currentTier={tier} credits={credits} />
        </>
    )
}
