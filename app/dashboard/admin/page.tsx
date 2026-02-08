'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2, Search, Zap, Shield, Gift, AlertTriangle, Users, Activity, DollarSign, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { getAdminStats, getUsersList, grantCredits, toggleUserTier, toggleAdminStatus, getUserMeetings } from "./actions"
import { toast } from "sonner"
import { format } from "date-fns"
import { useDebounce } from 'use-debounce'

// Avatar options for gradient display
const AVATAR_OPTIONS = [
    { id: "gradient-1", emoji: "🚀", bg: "from-blue-500 to-cyan-500" },
    { id: "gradient-2", emoji: "⚡", bg: "from-lime-500 to-green-500" },
    { id: "gradient-3", emoji: "🎨", bg: "from-pink-500 to-rose-500" },
    { id: "gradient-4", emoji: "🌟", bg: "from-amber-500 to-orange-500" },
    { id: "gradient-5", emoji: "💎", bg: "from-violet-500 to-purple-600" },
    { id: "gradient-6", emoji: "🔥", bg: "from-red-500 to-pink-500" },
]

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [debouncedSearch] = useDebounce(search, 500)
    const [currentPage, setCurrentPage] = useState(1)

    // Dialog states
    const [creditDialogOpen, setCreditDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [creditAmount, setCreditAmount] = useState('100')
    const [meetingsDialogOpen, setMeetingsDialogOpen] = useState(false)
    const [userMeetings, setUserMeetings] = useState<any[]>([])

    // Fetch Data
    const loadData = async (page = 1) => {
        setLoading(true)
        try {
            const statsRes = await getAdminStats()
            if (statsRes.error) throw new Error(statsRes.error)
            setStats(statsRes)

            const usersRes = await getUsersList(page, debouncedSearch)
            if (usersRes.error) throw new Error(usersRes.error)
            setUsers(usersRes.users || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData(currentPage)
    }, [debouncedSearch, currentPage])

    const handleGrantCredits = async () => {
        if (!selectedUser) return
        const amount = Number(creditAmount)
        if (!amount || isNaN(amount)) {
            toast.error("Please enter a valid number")
            return
        }

        try {
            const res = await grantCredits(selectedUser.id, amount)
            if (res.success) {
                toast.success(`Granted ${amount} credits to ${selectedUser.email}`)
                setCreditDialogOpen(false)
                loadData(currentPage)
            } else {
                toast.error(res.error)
            }
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const handleToggleTier = async (userId: string, currentTier: string, email: string) => {
        const newTier = currentTier === 'pro' ? 'free' : 'pro'
        const confirmed = confirm(`Change ${email} to ${newTier.toUpperCase()} tier?`)
        if (!confirmed) return

        try {
            const res = await toggleUserTier(userId, newTier)
            if (res.success) {
                toast.success(`Tier changed to ${newTier}`)
                loadData(currentPage)
            } else {
                toast.error(res.error)
            }
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean, email: string) => {
        const newStatus = !currentIsAdmin
        const confirmed = confirm(`${newStatus ? 'Grant' : 'Revoke'} admin access for ${email}?`)
        if (!confirmed) return

        try {
            const res = await toggleAdminStatus(userId, newStatus)
            if (res.success) {
                toast.success(`Admin status ${newStatus ? 'granted' : 'revoked'}`)
                loadData(currentPage)
            } else {
                toast.error(res.error)
            }
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const handleViewMeetings = async (user: any) => {
        setSelectedUser(user)
        try {
            const res = await getUserMeetings(user.id)
            if (res.success) {
                setUserMeetings(res.meetings || [])
                setMeetingsDialogOpen(true)
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
                <Button onClick={() => loadData(currentPage)} variant="outline" size="sm">Refresh Data</Button>
            </div>

            {/* Stats Cards - 8 total */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
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
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.totalUsers ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0}% of users
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users (7d)</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Last 7 days
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue (Est.)</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats?.revenueEstimate}/mo</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Based on Pro tier
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Meetings Processed</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalMeetings}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed Meetings</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.failedMeetings}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.totalMeetings ? Math.round((stats.failedMeetings / stats.totalMeetings) * 100) : 0}% failure rate
                        </p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Credits Distributed</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalCredits?.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all users
                        </p>
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
                                placeholder="Search by email or ID..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
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
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => {
                                        const avatarOption = AVATAR_OPTIONS.find(a => a.id === user.avatarId)

                                        return (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {/* Avatar */}
                                                        {user.avatarUrl && !user.avatarId ? (
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={user.avatarUrl} />
                                                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                                    {user.email?.charAt(0)?.toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ) : avatarOption ? (
                                                            <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${avatarOption.bg} flex items-center justify-center text-sm`}>
                                                                {avatarOption.emoji}
                                                            </div>
                                                        ) : (
                                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                                {user.email?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{user.fullName || user.email}</span>
                                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                                        </div>
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
                                                <TableCell>{user.credits?.toLocaleString()}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedUser(user)
                                                                setCreditDialogOpen(true)
                                                            }}
                                                        >
                                                            Add Credits
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleTier(user.id, user.tier, user.email)}
                                                        >
                                                            {user.tier === 'pro' ? 'Remove Pro' : 'Make Pro'}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleAdmin(user.id, user.isAdmin, user.email)}
                                                        >
                                                            {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewMeetings(user)}
                                                        >
                                                            View Meetings
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={users.length < 20}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Grant Credits Dialog */}
            <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Grant Credits</DialogTitle>
                        <DialogDescription>
                            Add credits to {selectedUser?.email}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="credits">Credit Amount</Label>
                            <Input
                                id="credits"
                                type="number"
                                placeholder="100"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Current balance: {selectedUser?.credits?.toLocaleString()} credits
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleGrantCredits}>
                            Grant Credits
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Meetings Dialog */}
            <Dialog open={meetingsDialogOpen} onOpenChange={setMeetingsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Meetings for {selectedUser?.email}</DialogTitle>
                        <DialogDescription>
                            Last 10 meetings
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userMeetings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            No meetings found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    userMeetings.map((meeting) => (
                                        <TableRow key={meeting.id}>
                                            <TableCell>{meeting.title}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    meeting.status === 'completed' ? 'default' :
                                                        meeting.status === 'failed' ? 'destructive' : 'secondary'
                                                }>
                                                    {meeting.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(meeting.created_at), 'MMM d, yyyy HH:mm')}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
