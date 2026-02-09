"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Zap, Brain, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"

export const AI_MODELS = [
    { id: 'gemini-flash', name: 'Gemini Flash', cost: 1, icon: Zap, color: 'text-yellow-500' },
    { id: 'gemini-pro', name: 'Gemini Pro', cost: 2, icon: Sparkles, color: 'text-purple-500' },
    { id: 'grok-2', name: 'Grok 2', cost: 2, icon: Rocket, color: 'text-blue-500' },
    { id: 'gpt-4o', name: 'ChatGPT-4o', cost: 3, icon: Brain, color: 'text-emerald-500' },
]

interface ModelSelectorProps {
    value: string
    onValueChange: (value: string) => void
    disabled?: boolean
    tier?: string
}

export function ModelSelector({ value, onValueChange, disabled }: ModelSelectorProps) {
    const selectedModel = AI_MODELS.find(m => m.id === value) || AI_MODELS[0]

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Select Analysis Model</label>
            <Select value={value} onValueChange={onValueChange} disabled={disabled}>
                <SelectTrigger className="w-[280px]">
                    <SelectValue>
                        <div className="flex items-center gap-2">
                            <selectedModel.icon className={cn("h-4 w-4", selectedModel.color)} />
                            <span className="font-medium">{selectedModel.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {selectedModel.cost} credits/min
                            </span>
                        </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2 w-full">
                                <model.icon className={cn("h-4 w-4", model.color)} />
                                <span>{model.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {model.cost} cr/min
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
