import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container max-w-4xl mx-auto h-16 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="font-bold text-lg tracking-tight">
                            Lumen Notes
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-sm font-medium text-muted-foreground">Legal</span>
                    </div>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to App
                        </Button>
                    </Link>
                </div>
            </header>
            <main className="container max-w-4xl mx-auto py-12 px-4 md:px-8">
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                    {children}
                </div>
            </main>
            <footer className="border-t border-border mt-12 bg-muted/20">
                <div className="container max-w-4xl mx-auto py-8 px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Lumen Notes. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/legal/privacy" className="hover:text-foreground underline-offset-4 hover:underline">
                            Privacy Policy
                        </Link>
                        <Link href="/legal/terms" className="hover:text-foreground underline-offset-4 hover:underline">
                            Terms of Use
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
