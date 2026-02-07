'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Zap, Shield, Gift, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { getAdminStats, getUsersList, grantCredits } from "./actions"
import { toast } from "sonner"
import { format } from "date-fns"

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')

    // Fetch Data
    const loadData = async () => {
        setLoading(true)
        try {
            const statsRes = await getAdminStats()
            if (statsRes.error) throw new Error(statsRes.error)
            setStats(statsRes)

            const usersRes = await getUsersList(1, search) // Pagination TODO
            if (usersRes.error) throw new Error(usersRes.error)
            setUsers(usersRes.users || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, []) // Search would need debounce + dependency

    const handleGrantCredits = async (userId: string) => {
        const amount = Number(prompt("Enter credit amount to grant:", "100"))
        if (!amount || isNaN(amount)) return

        try {
            const res = await grantCredits(userId, amount)
            if (res.success) {
                toast.success("Credits granted!")
                loadData()
            } else {
                toast.error(res.error)
            }
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    if (error === 'Unauthorized') {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <Shield className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground">You do not have admin privileges.</p>
            </div>
        )
    }

    if (loading && !stats) {
        return <div className="flex items-center justify-center h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage users and monitor system health</p>
                </div>
                <Button onClick={loadData} variant="outline" size="sm">Refresh Data</Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.proUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Meetings Processed</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalMeetings}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Credits Out</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalCredits}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage registered users</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users (Coming soon)..."
                                className="pl-8"
                                disabled
                            />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Credits</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.email}</span>
                                            <span className="text-xs text-muted-foreground">{user.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Badge variant={user.tier === 'pro' ? 'default' : 'secondary'}>
                                                {user.tier}
                                            </Badge>
                                            {user.isAdmin && <Badge variant="outline" className="border-primary text-primary">Admin</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.credits}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleGrantCredits(user.id)}
                                        >
                                            Grant Credits
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
