"use client"

import { Button } from "@/components/ui/button"
import { Calendar, Filter } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, useSearchParams } from "next/navigation"

export function DateFilter() {
    const searchParams = useSearchParams()
    const { replace } = useRouter()

    // Get current filter or default to 'all'
    const currentFilter = searchParams.get('date') || 'all'

    const handleFilterChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value === 'all') {
            params.delete('date')
        } else {
            params.set('date', value)
        }
        params.set('page', '1') // Reset page
        replace(`${window.location.pathname}?${params.toString()}`)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs border-border bg-card hover:bg-accent text-foreground">
                    <Calendar className="mr-2 h-3.5 w-3.5" />
                    {currentFilter === 'today' ? 'Today' :
                        currentFilter === 'week' ? 'Last 7 Days' :
                            currentFilter === 'month' ? 'Last 30 Days' : 'Presets'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={currentFilter === 'all'} onCheckedChange={() => handleFilterChange('all')}>
                    All Time
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={currentFilter === 'today'} onCheckedChange={() => handleFilterChange('today')}>
                    Today
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={currentFilter === 'week'} onCheckedChange={() => handleFilterChange('week')}>
                    Last 7 Days
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={currentFilter === 'month'} onCheckedChange={() => handleFilterChange('month')}>
                    Last 30 Days
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
