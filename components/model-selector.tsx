"use client"

import * as React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export const AVAILABLE_MODELS = [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Recommended)" },
    { value: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill 70B" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Fast)" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7b" },
]

interface ModelSelectorProps {
    value: string
    onValueChange: (value: string) => void
    disabled?: boolean
}

export function ModelSelector({ value, onValueChange, disabled }: ModelSelectorProps) {
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className="w-[200px] text-xs">
                <SelectValue placeholder="Select model..." />
            </SelectTrigger>
            <SelectContent>
                {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-xs">
                        {model.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
