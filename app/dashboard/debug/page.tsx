'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function DebugPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/debug/user')
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-8">
            <Card>
                <CardHeader>
                    <CardTitle>User Debug Info</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[600px]">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                    <div className="mt-4 space-y-2">
                        <p><strong>Is Admin:</strong> {data?.isAdmin ? '✅ YES' : '❌ NO'}</p>
                        <p><strong>Tier:</strong> {data?.settings?.tier || 'N/A'}</p>
                        <p><strong>Email:</strong> {data?.user?.email || 'N/A'}</p>
                        <p><strong>Avatar ID:</strong> {data?.user?.user_metadata?.avatar_id || 'null'}</p>
                        <p><strong>Avatar URL:</strong> {data?.user?.user_metadata?.avatar_url || 'N/A'}</p>
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        className="mt-4"
                    >
                        Refresh
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
