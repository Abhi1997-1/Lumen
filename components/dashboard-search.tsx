'use client'

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "use-debounce"
import { useEffect, useState } from "react"

export function DashboardSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(searchParams.get('query') || "")
    const [debouncedQuery] = useDebounce(query, 500)

    useEffect(() => {
        if (debouncedQuery) {
            router.push(`/dashboard/meetings?query=${encodeURIComponent(debouncedQuery)}`)
        } else if (query === "" && debouncedQuery === "") {
            // If expressly cleared, maybe go back to default? 
            // But be careful not to trigger loops.
            // Usually on dashboard root, search just redirects.
        }
    }, [debouncedQuery, router])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            router.push(`/dashboard/meetings?query=${encodeURIComponent(query)}`)
        }
    }

    return (
        <div className="relative w-full md:w-64 mr-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search transcripts..."
                className="pl-9 h-10 bg-background border-border"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </div>
    )
}
