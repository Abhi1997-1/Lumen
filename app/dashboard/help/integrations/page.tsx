import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"

export default function IntegrationsGuidePage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/help">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Connecting Integrations</h1>
            </div>

            <div className="space-y-8">
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Overview</h2>
                    <p className="text-muted-foreground">
                        Lumen Notes integrates with your favorite productivity tools to streamline your workflow. Currently, we support exporting to Notion and Microsoft OneNote.
                    </p>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-400">
                        <strong>Note:</strong> Direct API integration features are currently marked as "Coming Soon". We are finalizing the verified app approval process with these providers.
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xl font-semibold">How to Connect</h3>
                    <ol className="list-decimal pl-5 space-y-4 text-muted-foreground">
                        <li>
                            Navigate to <Link href="/dashboard/settings" className="text-primary hover:underline">Settings</Link>.
                        </li>
                        <li>
                            Scroll down to the <strong>Integrations</strong> card.
                        </li>
                        <li>
                            Click "Connect" next to your desired provider (Notion or OneNote).
                        </li>
                        <li>
                            Follow the OAuth login prompt to authorize Lumen Notes to access your workspace.
                        </li>
                    </ol>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xl font-semibold">Exporting Content</h3>
                    <p className="text-muted-foreground">
                        Once connected, you will see an <strong>Export</strong> button in every meeting view.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                        <li><strong>Notion:</strong> Creates a new page in your selected database with the meeting summary and a toggle block for the transcript.</li>
                        <li><strong>OneNote:</strong> Creates a new page in your default notebook section.</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}
