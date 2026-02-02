import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SummaryCardProps {
    summary: string
}

export function SummaryCard({ summary }: SummaryCardProps) {
    // Convert summary to bullet points if it isn't already (simple heuristic)
    const points = summary
        ? summary.split('. ').filter(p => p.trim().length > 0).map(p => p.trim().endsWith('.') ? p : p + '.')
        : ["No summary available yet."];

    return (
        <Card className="bg-[#0F1116] border-[#1F2128]">
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Summary</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white">
                    <Copy className="h-3 w-3" />
                </Button>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {points.map((point, i) => (
                        <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                            {point}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
