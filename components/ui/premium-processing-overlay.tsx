"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

interface PremiumProcessingOverlayProps {
    status?: string
    progress?: number
    onCancel?: () => void
    onDismiss?: () => void
}

export function PremiumProcessingOverlay({ status = "Processing...", onCancel, onDismiss }: PremiumProcessingOverlayProps) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
            onClick={(e) => {
                if (e.target === e.currentTarget && onDismiss) {
                    onDismiss();
                }
            }}
        >
            <div className="bg-[#0F1116] border border-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 duration-200 cursor-default">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-zinc-200">{status}</p>
                    <p className="text-xs text-zinc-500">
                        {onDismiss ? "Click outside to minimize" : "Please wait..."}
                    </p>
                </div>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-xs text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-zinc-800/50"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    )
}
