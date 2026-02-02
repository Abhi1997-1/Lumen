import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function SentimentCard() {
    return (
        <Card className="bg-[#0F1116] border-[#1F2128]">
            <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sentiment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-white">Positive</span>
                        <span className="text-zinc-500">65%</span>
                    </div>
                    <Progress value={65} className="h-1.5 bg-[#1F2128]" indicatorClassName="bg-emerald-500" />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-white">Neutral</span>
                        <span className="text-zinc-500">25%</span>
                    </div>
                    <Progress value={25} className="h-1.5 bg-[#1F2128]" indicatorClassName="bg-blue-500" />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-white">Negative</span>
                        <span className="text-zinc-500">10%</span>
                    </div>
                    <Progress value={10} className="h-1.5 bg-[#1F2128]" indicatorClassName="bg-red-500" />
                </div>
            </CardContent>
        </Card>
    )
}
