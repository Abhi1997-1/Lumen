"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, FileAudio, BrainCircuit, FileText } from "lucide-react"

interface ProcessingOverlayProps {
    status: string; // "compressing" | "uploading" | "creating_entry"
    progress: number;
}

export function ProcessingOverlay({ status, progress }: ProcessingOverlayProps) {
    const [steps, setSteps] = useState([
        { id: 'upload', label: 'Uploading Audio', subtext: 'Securely transferring file', icon: FileAudio, state: 'waiting' },
        { id: 'analyze', label: 'Analyzing Audio', subtext: 'Speaker identification & decoding', icon: BrainCircuit, state: 'waiting' },
        { id: 'finalize', label: 'Finalizing Transcript', subtext: 'Generating summary & actions', icon: FileText, state: 'waiting' },
    ])

    useEffect(() => {
        setSteps(prev => {
            const newSteps = [...prev]

            // Step 1: Upload (includes compression)
            if (status.includes('Compressing') || status.includes('Uploading')) {
                newSteps[0].state = 'active'
                newSteps[0].subtext = status // Show "Compressing..." or "Uploading..."
                newSteps[1].state = 'waiting'
                newSteps[2].state = 'waiting'
            } else if (status.includes('Creating meeting')) {
                newSteps[0].state = 'completed'
                newSteps[0].subtext = 'File securely uploaded'

                // Artificial delay for visual flow
                newSteps[1].state = 'active'
                setTimeout(() => {
                    newSteps[1].state = 'completed'
                    newSteps[2].state = 'active'
                }, 1500)
            }

            return newSteps
        })
    }, [status])

    // Calculate overall percentage for the big circle
    const visualProgress = status.includes('Compressing') ? progress * 0.3 :
        status.includes('Uploading') ? 30 + (progress * 0.6) :
            95

    const radius = 60
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (visualProgress / 100) * circumference

    return (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 p-8">

                {/* Left: Progress Stages */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2">Processing Recording</h2>
                        <p className="text-muted-foreground">Please keep this window open while we process your meeting.</p>
                    </div>

                    <div className="space-y-6 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border -z-10" />

                        {steps.map((step, i) => (
                            <div key={step.id} className="flex gap-4 items-start relative bg-background/50 backdrop-blur-sm p-2 rounded-xl transition-all duration-300">
                                <div className={`
                                    h-10 w-10 shrink-0 rounded-full border-2 flex items-center justify-center z-10 bg-background transition-colors duration-300
                                    ${step.state === 'completed' ? 'border-primary bg-primary text-primary-foreground' :
                                        step.state === 'active' ? 'border-primary text-primary shadow-[0_0_15px_rgba(124,58,237,0.3)]' :
                                            'border-border text-muted-foreground'}
                                `}>
                                    {step.state === 'completed' ? <Check className="h-5 w-5" /> :
                                        step.state === 'active' ? <Loader2 className="h-5 w-5 animate-spin" /> :
                                            <step.icon className="h-4 w-4" />}
                                </div>
                                <div className={`space-y-1 transition-opacity duration-300 ${step.state === 'waiting' ? 'opacity-50' : 'opacity-100'}`}>
                                    <h3 className="font-medium leading-none">{step.label}</h3>
                                    <p className="text-sm text-muted-foreground">{step.subtext}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Big Circle */}
                <div className="flex flex-col items-center justify-center p-8 bg-card/50 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />

                    <div className="relative h-64 w-64 flex items-center justify-center">
                        {/* Background Circle */}
                        <svg className="h-full w-full rotate-[-90deg]">
                            <circle
                                cx="128"
                                cy="128"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-muted/20"
                            />
                            {/* Progress Circle */}
                            <circle
                                cx="128"
                                cy="128"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeLinecap="round"
                                className="text-primary transition-all duration-500 ease-out drop-shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                                style={{ strokeDasharray: circumference, strokeDashoffset }}
                            />
                        </svg>

                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-bold tabular-nums tracking-tighter">
                                {Math.round(visualProgress)}<span className="text-2xl text-muted-foreground">%</span>
                            </span>
                            <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2 font-medium">Progress</span>
                        </div>
                    </div>

                    <div className="mt-8 text-center space-y-2 max-w-[240px]">
                        <p className="font-medium text-foreground animate-pulse">
                            {status.includes('Compressing') ? "Optimizing audio..." :
                                status.includes('Uploading') ? "Syncing to cloud..." :
                                    "Running AI Analysis..."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Our AI is mapping audio frequencies to high-accuracy text.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
