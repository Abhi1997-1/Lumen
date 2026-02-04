"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdvancedSearchToggle({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                "flex items-center gap-2 overflow-hidden transition-all duration-300",
                isOpen ? "w-auto opacity-100 mr-2" : "w-0 opacity-0"
            )}>
                {children}
            </div>

            <Button
                variant={isOpen ? "secondary" : "outline"}
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={cn("shrink-0 transition-colors", isOpen && "bg-muted text-foreground")}
                title="Advanced Filters"
            >
                {isOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            </Button>
        </div>
    )
}
