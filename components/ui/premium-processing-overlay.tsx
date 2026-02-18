"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

interface PremiumProcessingOverlayProps {
    status?: string
    progress?: number
    onCancel?: () => void
}

export function PremiumProcessingOverlay({ status = "Processing...", onCancel }: PremiumProcessingOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <p className="text-lg font-medium text-white">{status}</p>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-sm text-zinc-400 hover:text-white transition-colors mt-4"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    )
}
