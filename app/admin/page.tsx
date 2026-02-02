import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CheckCircle2, XCircle } from 'lucide-react'

// Simple check component
function StatusRow({ label, status, message }: { label: string, status: 'ok' | 'error', message?: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-0">
            <span className="font-medium">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{message}</span>
                {status === 'ok' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                )}
            </div>
        </div>
    )
}

export default async function AdminPage() {
    const checks = {
        envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'error',
        envKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'error',
        dbConnection: 'pending' as 'ok' | 'error',
        dbMessage: '',
        authStatus: 'pending' as 'ok' | 'error',
        userEmail: '',
    }

    // Check DB Connection
    try {
        const supabase = await createClient()

        // Check Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError && authError.status !== 401 && authError.status !== 400 && authError.status !== 403) {
            // 400/401/403 usually means "not logged in" which is fine for connection check, 
            // but if we want to check if the SERVICE is working, we assume the client creation didn't throw.
            checks.authStatus = 'error'
            checks.userEmail = `Auth Error: ${authError.message}`
        } else if (user) {
            checks.authStatus = 'ok'
            checks.userEmail = `Logged in as ${user.email}`
        } else {
            checks.authStatus = 'ok'
            checks.userEmail = 'Not logged in (Service reachable)'
        }

        // Check DB access (meetings table)
        // We select 1 just to see if table exists and is reachable. RLS might block, giving error.
        const { error: dbError } = await supabase.from('meetings').select('id').limit(1)

        if (dbError) {
            // RLS error is expected if not logged in, but connection is technically OK?
            // If error is "relation does not exist", table is missing.
            // If error is "PG Connection...", DB is down.
            if (dbError.code === 'PGRST301' || dbError.message.includes('permission')) {
                checks.dbConnection = 'ok'
                checks.dbMessage = 'Connected (RLS Active)'
            } else {
                checks.dbConnection = 'error'
                checks.dbMessage = dbError.message
            }
        } else {
            checks.dbConnection = 'ok'
            checks.dbMessage = 'Connected & Accessible'
        }

    } catch (e: any) {
        checks.dbConnection = 'error'
        checks.dbMessage = `Crash: ${e.message}`
        checks.authStatus = 'error'
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">System Diagnostics</h1>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Environment Variables</CardTitle>
                </CardHeader>
                <CardContent>
                    <StatusRow
                        label="NEXT_PUBLIC_SUPABASE_URL"
                        status={checks.envUrl as 'ok' | 'error'}
                        message={checks.envUrl === 'ok' ? 'Defined' : 'Missing'}
                    />
                    <StatusRow
                        label="NEXT_PUBLIC_SUPABASE_ANON_KEY"
                        status={checks.envKey as 'ok' | 'error'}
                        message={checks.envKey === 'ok' ? 'Defined' : 'Missing'}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Supabase Connectivity</CardTitle>
                </CardHeader>
                <CardContent>
                    <StatusRow
                        label="Auth Service"
                        status={checks.authStatus as 'ok' | 'error'}
                        message={checks.userEmail}
                    />
                    <StatusRow
                        label="Database (Meetings Table)"
                        status={checks.dbConnection}
                        message={checks.dbMessage}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
