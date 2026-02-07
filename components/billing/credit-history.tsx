'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Transaction {
    id: string
    amount: number
    type: 'purchase' | 'usage' | 'bonus' | 'adjustment'
    description: string
    created_at: string
}

export function CreditHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchHistory() {
            const supabase = createClient()
            const { data } = await supabase
                .from('credit_transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20)

            if (data) setTransactions(data)
            setLoading(false)
        }
        fetchHistory()
    }, [])

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Recent credit usage and purchases</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    No transactions yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <Badge variant={tx.amount > 0 ? "default" : "secondary"} className={tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none" : ""}>
                                            {tx.amount > 0 ? <ArrowDownLeft className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
                                            {tx.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={tx.description}>
                                        {tx.description}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                        {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className={`text-right font-mono ${tx.amount > 0 ? "text-emerald-500" : "text-foreground"}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
