'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export function CreditUsageBreakdown() {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient()
            const { data: usage } = await supabase
                .from('credit_transactions')
                .select('model, amount')
                .eq('type', 'usage')

            // Group by model (mocking model data since transaction might not have it directly yet, assuming description has it or we query meetings)
            // Ideally we should add 'model' column to transaction, but let's parse description for now if needed or just use type.
            // Wait, meetings table has model_used. 
            // Let's query meetings for accurate breakdown.

            const { data: meetings } = await supabase
                .from('meetings')
                .select('model_used, input_tokens, output_tokens')
                .not('model_used', 'is', null)

            if (meetings) {
                const breakdown: Record<string, number> = {}
                meetings.forEach(m => {
                    const model = m.model_used || 'Unknown'
                    breakdown[model] = (breakdown[model] || 0) + 1
                })

                const chartData = Object.entries(breakdown).map(([name, value]) => ({ name, value }))
                setData(chartData)
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

    if (loading) return <div className="h-[200px] flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>

    if (data.length === 0) return (
        <Card>
            <CardHeader>
                <CardTitle>Usage Breakdown</CardTitle>
                <CardDescription>No usage data available yet</CardDescription>
            </CardHeader>
        </Card>
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>Model Usage</CardTitle>
                <CardDescription>Meetings processed by model</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
