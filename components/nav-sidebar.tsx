'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Mic, LayoutDashboard, Settings, FileText, Calendar, Users, BarChart3, HelpCircle } from 'lucide-react'
import { ModeToggle } from '@/components/theme-toggle'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Meetings', href: '/dashboard/meetings', icon: FileText },
    { name: 'Notes', href: '/dashboard/notes', icon: FileText },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Teams', href: '/dashboard/teams', icon: Users },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

const secondaryNavItems = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
]

export function NavSidebar({ user }: { user: any }) {
    const pathname = usePathname()

    return (
        <div className="flex h-full flex-col gap-4 bg-card border-r border-border w-full">
            <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6 shrink-0 border-b border-border/40">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Mic className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold text-foreground">Lumen Notes</span>
                </Link>
            </div>

            <div className="flex-1 py-6 px-4 space-y-8 overflow-y-auto">
                {/* Primary Nav */}
                <nav className="grid gap-1.5">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary shadow-sm"
                                    : "hover:bg-accent hover:text-foreground text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Secondary Nav */}
                <nav className="grid gap-1.5 pt-4 border-t border-border">
                    <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">System</span>
                    {secondaryNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-accent hover:text-foreground text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* User Profile & Theme Toggle */}
            <div className="mt-auto border-t border-border p-4 bg-background/50">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors cursor-pointer group">
                            {/* User Info */}
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg ring-2 ring-background group-hover:ring-blue-500/30 transition-all">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0 text-left">
                                <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{user?.user_metadata?.full_name || 'User'}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={user.email}>Free Plan</span>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start" side="right" sideOffset={10}>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="p-0">
                            <form action="/auth/signout" method="post" className="w-full">
                                <button className="w-full flex w-full items-center px-2 py-1.5 text-sm">
                                    Log out
                                </button>
                            </form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>


            </div>
        </div>
    )
}

