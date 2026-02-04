import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, PlayCircle, FileText, Sparkles } from "lucide-react"

export default function GettingStartedPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/help">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Getting Started Guide</h1>
            </div>

            <div className="grid gap-6">
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Welcome to Lumen Notes</h2>
                    <p className="text-muted-foreground">
                        Lumen Notes is your intelligent meeting assistant. We help you record, transcribe, and analyze your conversations so you can focus on the discussion, not the note-taking.
                    </p>
                </section>

                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <PlayCircle className="h-8 w-8 text-indigo-500 mb-2" />
                            <CardTitle>1. Record</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Click "New Meeting" to enter the Live Studio. You can record audio directly or upload an existing file.
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardHeader>
                            <Sparkles className="h-8 w-8 text-purple-500 mb-2" />
                            <CardTitle>2. Analyze</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Our AI immediately processes your recording to generate a transcript, summary, and action items.
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardHeader>
                            <FileText className="h-8 w-8 text-emerald-500 mb-2" />
                            <CardTitle>3. Organize</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Sort meetings into Folders, search by keywords, and export your notes to other tools.
                        </CardContent>
                    </Card>
                </div>

                <section className="space-y-4 pt-4">
                    <h3 className="text-xl font-semibold">Key Features</h3>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                        <li><strong>Live Studio:</strong> Real-time visualization of your recording.</li>
                        <li><strong>AI Chat:</strong> Ask questions about your meeting content (e.g., "What were the dates mentioned?").</li>
                        <li><strong>Folders:</strong> Drag and drop meetings into folders for better organization.</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}
