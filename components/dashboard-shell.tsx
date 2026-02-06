"use client"

import { useState } from "react"
import { NavSidebar } from "@/components/nav-sidebar"
import { Button } from "@/components/ui/button"
import { Menu, Mic } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
    user: any
    children: React.ReactNode
    usageData?: { used: number, limit: number, tier: string }
}

export function DashboardShell({ user, children, usageData }: DashboardShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex min-h-screen w-full bg-background/50">
            {/* Desktop Sidebar - Hidden on mobile */}
            <aside className={cn(
                "hidden lg:block sticky top-0 h-screen shrink-0 z-40 border-r border-border transition-[width] duration-300",
                isCollapsed ? "w-[60px]" : "w-[240px]"
            )}>
                <NavSidebar
                    user={user}
                    collapsed={isCollapsed}
                    onToggle={() => setIsCollapsed(!isCollapsed)}
                    usageData={usageData}
                />
            </aside>


            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header - Visible only on mobile */}
                <header className="lg:hidden flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 sticky top-0 z-30">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="-ml-2">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[240px] border-r">
                            {/* Mobile Sidebar - Always expanded, no toggle */}
                            <NavSidebar
                                user={user}
                                collapsed={false}
                                onToggle={() => { }}
                                isMobile={true}
                                onMobileClose={() => setIsMobileMenuOpen(false)}
                                usageData={usageData}
                            />
                        </SheetContent>
                    </Sheet>

                    <div className="flex items-center gap-2 font-semibold">
                        <Link href="/" className="flex items-center gap-2">
                            <Mic className="h-5 w-5 text-primary" />
                            <span className="text-lg font-bold">Lumen</span>
                        </Link>
                    </div>
                </header>

                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}
