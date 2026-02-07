"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, CheckCircle } from "lucide-react"
import { getProviderStatus } from "@/app/dashboard/new/actions"

interface Provider {
    id: string
    name: string
    connected: boolean
    description: string
}

interface ProviderSelectorProps {
    onProviderChange: (provider: string) => void
    disabled?: boolean
}

export function ProviderSelector({ onProviderChange, disabled }: ProviderSelectorProps) {
    const [providers, setProviders] = useState<Provider[]>([])
    const [selectedProvider, setSelectedProvider] = useState<string>('gemini')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStatus() {
            try {
                const status = await getProviderStatus()
                setProviders(status.providers)
                setSelectedProvider(status.defaultProvider)
                onProviderChange(status.defaultProvider)
            } catch (e) {
                console.error("Failed to fetch provider status:", e)
            } finally {
                setLoading(false)
            }
        }
        fetchStatus()
    }, [])

    const handleChange = (value: string) => {
        setSelectedProvider(value)
        onProviderChange(value)
    }

    if (loading) {
        return (
            <div className="h-10 w-48 bg-muted animate-pulse rounded-md" />
        )
    }

    const currentProvider = providers.find(p => p.id === selectedProvider)

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Process with:</span>
            <Select value={selectedProvider} onValueChange={handleChange} disabled={disabled}>
                <SelectTrigger className="w-48">
                    <SelectValue>
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span>{currentProvider?.name}</span>
                            {currentProvider?.connected && (
                                <CheckCircle className="h-3 w-3 text-emerald-500" />
                            )}
                        </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                <span>{provider.name}</span>
                                {provider.connected ? (
                                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                                ) : (
                                    <span className="text-xs text-amber-500 ml-1">(No Key)</span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
