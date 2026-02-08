'use client'

import { UsageCard } from "@/components/usage-card"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Mic, LayoutDashboard, Settings, FileText, Calendar, Users, BarChart3, HelpCircle, ChevronLeft, Menu, Coins, Sparkles, Shield } from 'lucide-react'
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
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Credits', href: '/dashboard/settings?tab=billing', icon: Coins },
]

const secondaryNavItems = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
]

// Avatar gradient mapping
const AVATAR_MAP: Record<string, string> = {
    "avatar-0": "bg-gradient-to-br from-red-500 to-orange-500",
    "avatar-1": "bg-gradient-to-br from-amber-500 to-yellow-500",
    "avatar-2": "bg-gradient-to-br from-lime-500 to-green-500",
    "avatar-3": "bg-gradient-to-br from-emerald-500 to-teal-500",
    "avatar-4": "bg-gradient-to-br from-cyan-500 to-sky-500",
    "avatar-5": "bg-gradient-to-br from-blue-500 to-indigo-500",
    "avatar-6": "bg-gradient-to-br from-violet-500 to-purple-500",
    "avatar-7": "bg-gradient-to-br from-fuchsia-500 to-pink-500",
}

interface NavSidebarProps {
    user: any
    collapsed: boolean
    onToggle: () => void
    isMobile?: boolean
    onMobileClose?: () => void
    usageData?: { credits: number, tier: string, hasApiKey: boolean, preferOwnKey?: boolean, isAdmin?: boolean }
}

export function NavSidebar({ user, collapsed, onToggle, isMobile = false, onMobileClose, usageData }: NavSidebarProps) {
    const pathname = usePathname()

    const handleLinkClick = () => {
        if (isMobile && onMobileClose) {
            onMobileClose()
        }
    }

    return (
        <div
            className={cn(
                "flex h-full flex-col gap-4 bg-[hsl(var(--sidebar-bg))] transition-all duration-300 ease-in-out shrink-0",
                !isMobile && "border-r border-[hsl(var(--sidebar-border))]",
                collapsed ? "w-[60px]" : "w-full lg:w-[240px]"
            )}
        >
            <div className="flex h-14 items-center px-4 lg:h-[60px] shrink-0">
                <div className="flex items-center w-full">
                    {!collapsed && (
                        <Link href="/" className="flex items-center gap-2 font-semibold overflow-hidden whitespace-nowrap" onClick={handleLinkClick}>
                            <Mic className="h-6 w-6 text-primary" />
                            <span className="text-lg font-bold text-foreground">Lumen</span>
                        </Link>
                    )}
                    {!isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className={cn("text-muted-foreground hover:text-foreground ml-auto", collapsed && "mx-auto")}
                        >
                            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 py-4 px-2 space-y-8 overflow-y-auto overflow-x-hidden">
                {/* Primary Nav */}
                <nav className="grid gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                                collapsed && "justify-center px-2"
                            )}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon className={cn("h-4 w-4 shrink-0", pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            {!collapsed && <span>{item.name}</span>}
                            {collapsed && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border shadow-md">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Secondary Nav */}
                <nav className="grid gap-1 pt-4 border-t border-[hsl(var(--sidebar-border))]">
                    {!collapsed && <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">System</span>}
                    {secondaryNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                                collapsed && "justify-center px-2"
                            )}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                            {!collapsed && <span>{item.name}</span>}
                            {collapsed && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border shadow-md">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    ))}
                    {/* Admin Link */}
                    {usageData?.isAdmin && (
                        <Link
                            href="/dashboard/admin"
                            onClick={handleLinkClick}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative text-amber-500 hover:text-amber-600 hover:bg-amber-500/10",
                                pathname === '/dashboard/admin' && "bg-amber-500/10",
                                collapsed && "justify-center px-2"
                            )}
                            title={collapsed ? "Admin" : undefined}
                        >
                            <Shield className="h-4 w-4 shrink-0" />
                            {!collapsed && <span>Admin</span>}
                            {collapsed && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border shadow-md">
                                    Admin
                                </div>
                            )}
                        </Link>
                    )}

                    {/* Donate Button for Free Tier */}
                    {usageData?.tier === 'free' && (
                        <a
                            href="https://buy.stripe.com/test_donate"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative text-pink-500 hover:text-pink-600 hover:bg-pink-500/10",
                                collapsed && "justify-center px-2"
                            )}
                            title={collapsed ? "Donate" : undefined}
                        >
                            <Sparkles className="h-4 w-4 shrink-0" />
                            {!collapsed && <span>Donate</span>}
                            {collapsed && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border shadow-md">
                                    Donate
                                </div>
                            )}
                        </a>
                    )}

                </nav>
            </div>


            <div className="mt-4 border-t border-[hsl(var(--sidebar-border))] p-2 bg-[hsl(var(--sidebar-bg))]">
                {/* Usage Card - Only show when expanded or on mobile */}
                {(!collapsed && usageData) && (
                    <div className="mb-2 px-2">
                        <UsageCard
                            credits={usageData.credits}
                            tier={usageData.tier}
                            hasApiKey={usageData.hasApiKey}
                            preferOwnKey={usageData.preferOwnKey}
                        />
                    </div>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn("w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group outline-none", collapsed && "justify-center")}>
                            {/* User Avatar */}
                            {(user?.user_metadata?.avatar_id && user.user_metadata.avatar_id !== 'null' && user.user_metadata.avatar_id !== '') ? (
                                <div className={`h-8 w-8 rounded-full ${AVATAR_MAP[user.user_metadata.avatar_id] || 'bg-gradient-to-br from-blue-500 to-indigo-500'} flex items-center justify-center shrink-0 shadow-sm`}></div>
                            ) : user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="h-8 w-8 rounded-full object-cover shrink-0 shadow-sm" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                    {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {!collapsed && (
                                <div className="flex flex-col min-w-0 text-left">
                                    <span className="text-sm font-semibold text-foreground truncate">{user?.user_metadata?.full_name || 'User'}</span>
                                    <span className="text-[10px] text-muted-foreground truncate" title={user.email}>
                                        {usageData?.isAdmin ? 'Admin' : usageData?.tier === 'pro' ? 'Pro Plan' : usageData?.tier === 'unlimited' ? 'Pro Unlimited' : 'Free Plan'}
                                    </span>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start" side="right" sideOffset={10}>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/settings" className="w-full block hover:underline cursor-pointer font-semibold">
                                My Account
                            </Link>
                        </DropdownMenuItem>
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

