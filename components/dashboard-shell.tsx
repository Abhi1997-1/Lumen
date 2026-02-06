"use client"

import { useState } from "react"
import { NavSidebar } from "@/components/nav-sidebar"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
    user: any
    children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    return (
        <div className="flex min-h-screen w-full bg-background/50">
            <aside className="sticky top-0 h-screen shrink-0 z-40">
                <NavSidebar
                    user={user}
                    collapsed={isCollapsed}
                    onToggle={() => setIsCollapsed(!isCollapsed)}
                />
            </aside>
            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}
