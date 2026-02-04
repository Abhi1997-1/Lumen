import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Mic, ShieldAlert, Volume2 } from "lucide-react"

export default function RecordingGuidePage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/help">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Recording Best Practices</h1>
            </div>

            <div className="grid gap-8">
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xl font-semibold text-foreground">
                        <Volume2 className="h-5 w-5 text-emerald-500" />
                        <h2>Audio Quality Tips</h2>
                    </div>
                    <ul className="grid gap-4 md:grid-cols-2">
                        <li className="p-4 rounded-xl bg-card border border-border">
                            <strong>Minimize Background Noise:</strong> Try to record in a quiet room. Fans, traffic, and other voices can confuse the AI transcription.
                        </li>
                        <li className="p-4 rounded-xl bg-card border border-border">
                            <strong>Use External Microphones:</strong> While laptop mics work, a dedicated headset or USB mic significantly improves accuracy.
                        </li>
                        <li className="p-4 rounded-xl bg-card border border-border">
                            <strong>Speak Clearly:</strong> Avoid talking over one another. The AI works best with clear, distinct speakers.
                        </li>
                        <li className="p-4 rounded-xl bg-card border border-border">
                            <strong>Check Input Settings:</strong> Before starting, verify the correct microphone is selected in your browser settings.
                        </li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xl font-semibold text-foreground">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        <h2>Legal & Ethical Recording</h2>
                    </div>
                    <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-muted-foreground space-y-4">
                        <p>
                            <strong>Consent is Key:</strong> Always inform all participants effectively that the meeting is being recorded.
                        </p>
                        <p>
                            Many jurisdictions follow <strong>Two-Party Consent</strong> laws, meaning it is illegal to record a conversation unless <em>everyone</em> involved agrees.
                        </p>
                        <p>
                            <strong>Best Practice:</strong> Start every recording by stating clearly: <em>"I am recording this session for notes, is everyone okay with that?"</em> and wait for verbal confirmation.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    )
}
