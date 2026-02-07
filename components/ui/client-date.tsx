"use client"

import { useEffect, useState } from "react"

interface ClientDateProps {
    date: string | Date
    mode?: 'date' | 'time' | 'full'
    className?: string
}

export function ClientDate({ date, mode = 'date', className }: ClientDateProps) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) return <span className={`opacity-0 ${className}`}>...</span>

    const d = new Date(date)

    if (mode === 'time') {
        return <span className={className}>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    }

    if (mode === 'full') {
        return <span className={className}>{d.toLocaleString()}</span>
    }

    return <span className={className}>{d.toLocaleDateString("en-US", {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })}</span>
}
