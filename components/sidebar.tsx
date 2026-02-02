"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Settings, Radio } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card px-4 py-8">
            <div className="mb-8 flex items-center gap-2 px-2">
                <Radio className="h-6 w-6 text-primary animate-pulse" />
                <span className="text-xl font-bold tracking-tight">Lumen Notes</span>
            </div>
            <nav className="flex flex-1 flex-col gap-2">
                <Link href="/dashboard">
                    <Button
                        variant={pathname === "/dashboard" ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Meetings
                    </Button>
                </Link>
                <Link href="/settings">
                    <Button
                        variant={pathname === "/settings" ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Button>
                </Link>
            </nav>
            <div className="mt-auto px-2 text-xs text-muted-foreground">
                Lumen Version 1.0.0
            </div>
        </div>
    );
}
