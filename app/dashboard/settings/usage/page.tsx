import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Zap, TrendingUp } from "lucide-react"
import { redirect } from 'next/navigation'

export default async function UsagePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Check if migration has been run
    const { data: limits, error: limitsError } = await supabase
        .from('user_rate_limits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    if (limitsError || !limits) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <Card className="border-amber-200 dark:border-amber-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <Clock className="h-5 w-5" />
                            Migration Required
                        </CardTitle>
                        <CardDescription>
                            The rate limiting system needs to be set up in your database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            To view your API usage statistics, you need to run the database migration first.
                        </p>
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-xs font-medium mb-2">Steps:</p>
                            <ol className="text-xs space-y-1 list-decimal list-inside">
                                <li>Open Supabase Dashboard → SQL Editor</li>
                                <li>Open: <code className="text-xs bg-background px-1 rounded">supabase/migrations/20260208_add_rate_limiting.sql</code></li>
                                <li>Copy all contents and paste into SQL Editor</li>
                                <li>Click "Run" to execute the migration</li>
                                <li>Refresh this page</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Get today's usage
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: geminiToday } = await supabase
        .from('api_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('provider', 'gemini')
        .eq('success', true)
        .gte('created_at', today.toISOString())

    const { data: recentUsage } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

    const geminiLimit = limits.gemini_rpd || 100
    const geminiUsed = geminiToday || 0
    const geminiRemaining = geminiLimit - geminiUsed
    const geminiPercentage = (geminiUsed / geminiLimit) * 100

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">API Usage Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Monitor your API consumption and limits
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{limits.tier}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {limits.tier === 'free' ? 'Limited to 100 requests/day' : '1000+ requests/day'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{geminiUsed} / {geminiLimit}</div>
                        <Progress value={geminiPercentage} className="h-2 mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Remaining Today</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{geminiRemaining}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Resets at midnight
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Usage */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent API Calls</CardTitle>
                    <CardDescription>Your last 10 API requests</CardDescription>
                </CardHeader>
                <CardContent>
                    {!recentUsage || recentUsage.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No API usage yet</p>
                    ) : (
                        <div className="space-y-2">
                            {recentUsage.map((usage) => (
                                <div key={usage.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Badge variant={usage.success ? 'default' : 'destructive'}>
                                            {usage.provider}
                                        </Badge>
                                        <div>
                                            <p className="text-sm font-medium">{usage.endpoint || 'API Call'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(usage.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {usage.success ? (
                                            <p className="text-sm font-medium">{usage.tokens_used || 0} tokens</p>
                                        ) : (
                                            <p className="text-sm text-destructive">{usage.error_code}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {limits.tier === 'free' && (
                <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-indigo-500" />
                            Upgrade to Pro
                        </CardTitle>
                        <CardDescription>Get 10x more API requests and advanced features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <ul className="text-sm space-y-1">
                            <li>✓ 1000 API requests per day (vs 100)</li>
                            <li>✓ 60 requests per minute (vs 10)</li>
                            <li>✓ Priority processing queue</li>
                            <li>✓ Advanced AI model access</li>
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
