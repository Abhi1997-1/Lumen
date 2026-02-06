"use client"

import * as React from "react"
import { Check, FileAudio, Sparkles, User, FileText, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PremiumProcessingOverlayProps {
    status: string
    progress: number
    onCancel?: () => void
}

export function PremiumProcessingOverlay({ status, progress, onCancel }: PremiumProcessingOverlayProps) {
    // Determine current stage based on status or progress
    // Simple heuristic for demo purposes
    const getStage = () => {
        if (status.toLowerCase().includes("upload") || status.toLowerCase().includes("compress")) return 1;
        if (status.toLowerCase().includes("analyz") || progress < 40) return 2;
        if (status.toLowerCase().includes("identify") || progress < 70) return 3;
        return 4;
    }

    const currentStage = getStage();

    return (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-6xl h-[85vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">

                {/* Header (Absolute) */}
                <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20 pointer-events-none">
                    <div className="flex items-center gap-3 pointer-events-auto">
                        <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-tight">Lumen AI Transcriber</h2>
                            <p className="text-xs text-muted-foreground">Lumen Studio v1.0</p>
                        </div>
                    </div>
                </div>

                {/* Left Panel: Stages */}
                <div className="w-full md:w-[320px] bg-muted/30 border-r border-border p-8 pt-24 flex flex-col gap-8 hidden md:flex">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Processing Stages</h3>

                    <StageItem
                        icon={FileAudio}
                        label="File Uploaded"
                        subLabel="Success • Verified"
                        state={currentStage > 1 ? "completed" : currentStage === 1 ? "active" : "pending"}
                    />
                    <div className="h-8 w-0.5 bg-border ml-5 -my-4" />

                    <StageItem
                        icon={Sparkles}
                        label="Analyzing Audio"
                        subLabel="Processing patterns..."
                        state={currentStage > 2 ? "completed" : currentStage === 2 ? "active" : "pending"}
                    />
                    <div className="h-8 w-0.5 bg-border ml-5 -my-4" />

                    <StageItem
                        icon={User}
                        label="Identifying Speakers"
                        subLabel="Pending"
                        state={currentStage > 3 ? "completed" : currentStage === 3 ? "active" : "pending"}
                    />
                    <div className="h-8 w-0.5 bg-border ml-5 -my-4" />

                    <StageItem
                        icon={FileText}
                        label="Finalizing Transcript"
                        subLabel="Waiting"
                        state={currentStage > 4 ? "completed" : currentStage === 4 ? "active" : "pending"}
                    />
                </div>

                {/* Center Panel: Progress */}
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-background relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent" />

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Smooth Circular Progress */}
                        <div className="relative h-64 w-64 flex items-center justify-center mb-12">
                            {/* SVG Progress Circle */}
                            <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
                                {/* Track */}
                                <circle
                                    className="stroke-muted"
                                    strokeWidth="6"
                                    fill="transparent"
                                    r="45"
                                    cx="50"
                                    cy="50"
                                />
                                {/* Progress */}
                                <circle
                                    className="stroke-indigo-600 transition-all duration-1000 ease-out"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    fill="transparent"
                                    r="45"
                                    cx="50"
                                    cy="50"
                                    strokeDasharray="282.7" // 2 * PI * 45
                                    strokeDashoffset={282.7 - (282.7 * progress) / 100}
                                />
                            </svg>

                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-6xl font-bold tracking-tighter tabular-nums text-foreground">
                                    {Math.round(progress)}<span className="text-3xl text-muted-foreground">%</span>
                                </span>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Progress</span>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-foreground text-center mb-3">Transcribing Audio Content</h1>
                        <p className="text-muted-foreground text-center max-w-md">
                            Our AI is currently mapping audio frequencies to high-accuracy text. {status}
                        </p>

                        <div className="mt-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm text-xs font-bold text-indigo-900 uppercase tracking-widest">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                Live Engine Status: Optimal
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Live Preview Mock */}
                <div className="w-[300px] bg-card border-l border-border hidden xl:flex flex-col">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <span className="text-sm font-semibold">Live Preview</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase">Real-Time</span>
                    </div>
                    <LivePreviewLog />
                </div>

                {onCancel && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                        <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <X className="h-4 w-4" /> Cancel Processing
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function StageItem({ icon: Icon, label, subLabel, state }: { icon: any, label: string, subLabel: string, state: "pending" | "active" | "completed" }) {
    return (
        <div className={cn("flex items-start gap-4 transition-all duration-500", state === "pending" && "opacity-40 grayscale")}>
            <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors duration-500",
                state === "completed" ? "bg-green-100 border-green-500 text-green-600" :
                    state === "active" ? "bg-indigo-50 border-indigo-500 text-indigo-600 animate-pulse" :
                        "bg-muted border-transparent text-muted-foreground"
            )}>
                {state === "completed" ? <Check className="h-5 w-5" /> :
                    state === "active" ? <Loader2 className="h-5 w-5 animate-spin" /> :
                        <Icon className="h-5 w-5" />}
            </div>
            <div>
                <h4 className={cn("text-sm font-semibold transition-colors", state === "active" ? "text-indigo-600" : "text-foreground")}>{label}</h4>
                <p className="text-xs text-muted-foreground">{subLabel}</p>
            </div>
        </div>
    )
}

function LivePreviewLog() {
    const [lines, setLines] = React.useState<string[]>([])
    const messages = [
        "Initializing audio stream...",
        "Detecting speaker voice signature...",
        "Identifying background noise floor...",
        "Speaker 1: Welcome everyone to the meeting.",
        "Speaker 1: Today we are discussing Q3 goals.",
        "Processing harmonic frequencies...",
        "Speaker 2: I have the data ready to present.",
        "Analyzing sentiment patterns...",
        "Speaker 1: Excellent. Let's start with the sales figures.",
        "Transcribing segment 442-A...",
        "Speaker 2: Sales are up 15% quarter over quarter.",
        "Generating semantic summary...",
        "Speaker 3: That exceeds our projections.",
        "Optimizing for clarity...",
        "Speaker 1: Great work team. Let's keep this momentum.",
    ]

    React.useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index < messages.length) {
                setLines(prev => [...prev, messages[index]].slice(-8)) // Keep last 8 lines
                index++;
            } else {
                // simple loop for demo
                index = 0;
            }
        }, 1200); // New line every 1.2s

        return () => clearInterval(interval);
    }, [])

    return (
        <div className="flex-1 p-6 space-y-4 overflow-hidden relative font-mono text-xs text-muted-foreground">
            {lines.map((line, i) => (
                <div key={i} className="animate-in slide-in-from-bottom-2 fade-in duration-500">
                    <span className="text-indigo-400 mr-2">{">"}</span>
                    {line}
                </div>
            ))}

            <div className="animate-pulse flex items-center gap-2 text-indigo-500">
                <span className="h-2 w-2 bg-indigo-500 rounded-full" />
                Processing...
            </div>

            {/* Fade out bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        </div>
    )
}
