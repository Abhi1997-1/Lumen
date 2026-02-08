"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Settings, User, Plug, Trash2, Check, Sparkles, CreditCard } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { SettingsForm } from "./settings-form"
import { IntegrationsCard } from "@/components/settings/integrations-card"
import { CreditHistory } from "@/components/billing/credit-history"
import { CreditUsageBreakdown } from "@/components/billing/usage-breakdown"
import { getSettings } from "./actions"
import { getIntegrationsStatus } from "./integrations-actions"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Fun avatar options - emoji-style gradients with unique designs
const AVATAR_OPTIONS = [
    { id: 'gradient-1', bg: 'from-violet-500 to-purple-600', emoji: '🚀' },
    { id: 'gradient-2', bg: 'from-pink-500 to-rose-500', emoji: '🌸' },
    { id: 'gradient-3', bg: 'from-amber-400 to-orange-500', emoji: '🔥' },
    { id: 'gradient-4', bg: 'from-emerald-400 to-teal-500', emoji: '🌿' },
    { id: 'gradient-5', bg: 'from-blue-400 to-indigo-500', emoji: '💎' },
    { id: 'gradient-6', bg: 'from-fuchsia-500 to-pink-500', emoji: '🦄' },
    { id: 'gradient-7', bg: 'from-cyan-400 to-blue-500', emoji: '🌊' },
    { id: 'gradient-8', bg: 'from-yellow-400 to-amber-500', emoji: '⭐' },
    { id: 'gradient-9', bg: 'from-red-500 to-rose-600', emoji: '❤️' },
    { id: 'gradient-10', bg: 'from-lime-400 to-green-500', emoji: '🍀' },
    { id: 'gradient-11', bg: 'from-indigo-500 to-purple-600', emoji: '🔮' },
    { id: 'gradient-12', bg: 'from-slate-600 to-zinc-700', emoji: '🌙' },
]

export default function SettingsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    // Tab State
    const [activeTab, setActiveTab] = useState("account")

    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [settings, setSettings] = useState<any>(null)
    const [integrationsStatus, setIntegrationsStatus] = useState<any>(null)
    const [displayName, setDisplayName] = useState("")
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState("")

    // Handle URL param for tabs
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab && ['account', 'billing', 'api', 'integrations'].includes(tab)) {
            setActiveTab(tab)
        }
    }, [searchParams])

    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                setUser(user)
                setDisplayName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || "")
                setSelectedAvatar(user?.user_metadata?.avatar_id || null)

                const [settingsData, integrations] = await Promise.all([
                    getSettings(),
                    getIntegrationsStatus()
                ])
                setSettings(settingsData || {
                    hasGeminiKey: false,
                    hasOpenAIKey: false,
                    hasGroqKey: false,
                    selectedProvider: 'gemini'
                })
                setIntegrationsStatus(integrations)
            } catch (error) {
                console.error("Failed to load settings:", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const handleUpdateProfile = async () => {
        if (!user) return
        setSaving(true)
        try {
            // Explicitly set to null if using profile photo, otherwise use selected gradient
            const avatarValue = selectedAvatar === null ? null : selectedAvatar

            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: displayName,
                    avatar_id: avatarValue
                }
            })
            if (error) throw error
            toast.success("Profile updated! Refreshing...")

            // Force a full page reload to ensure user object is updated
            setTimeout(() => {
                window.location.reload()
            }, 500)
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile")
            setSaving(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") return
        setDeleting(true)
        try {
            // Call server action to delete account data
            const { deleteUserAccount } = await import("@/app/actions")
            const result = await deleteUserAccount()
            if (!result.success) throw new Error(result.error)

            await supabase.auth.signOut()
            toast.success("Account deleted. Goodbye! 👋")
            router.push("/")
        } catch (error: any) {
            toast.error(error.message || "Failed to delete account")
            setDeleting(false)
        }
    }

    const getAvatarById = (id: string | null) => {
        return AVATAR_OPTIONS.find(a => a.id === id)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const currentAvatar = getAvatarById(selectedAvatar)

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground animate-in fade-in duration-300">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                        <p className="text-muted-foreground">Manage your account, API connections, and integrations.</p>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                            <TabsTrigger value="account" className="gap-2">
                                <User className="h-4 w-4" />
                                Account
                            </TabsTrigger>
                            <TabsTrigger value="billing" className="gap-2">
                                <CreditCard className="h-4 w-4" />
                                Billing
                            </TabsTrigger>
                            <TabsTrigger value="api" className="gap-2">
                                <Settings className="h-4 w-4" />
                                API Keys
                            </TabsTrigger>
                            <TabsTrigger value="integrations" className="gap-2">
                                <Plug className="h-4 w-4" />
                                Integrations
                            </TabsTrigger>
                        </TabsList>

                        {/* Account Tab */}
                        <TabsContent value="account" className="space-y-6">
                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle>Profile</CardTitle>
                                    <CardDescription>Manage your personal information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Current Avatar Display */}
                                    <div className="flex items-center gap-6">
                                        {/* Show avatar based on priority: avatar_url > selected gradient > fallback */}
                                        {user?.user_metadata?.avatar_url && !selectedAvatar ? (
                                            <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                                                <AvatarImage src={user.user_metadata.avatar_url} />
                                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                                    {displayName?.charAt(0)?.toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : currentAvatar ? (
                                            <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${currentAvatar.bg} flex items-center justify-center text-3xl shadow-lg ring-2 ring-primary/20`}>
                                                {currentAvatar.emoji}
                                            </div>
                                        ) : (
                                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                                {displayName?.charAt(0)?.toUpperCase() || "U"}
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-semibold">{displayName || "User"}</h3>
                                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                                            {user?.app_metadata?.provider && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Signed in with {user.app_metadata.provider}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Avatar Picker */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            <Label className="text-base font-semibold">Choose Your Avatar</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {user?.user_metadata?.avatar_url
                                                ? "Use your profile photo or pick a fun avatar!"
                                                : "Pick a fun avatar that represents you!"}
                                        </p>
                                        <div className="grid grid-cols-6 gap-3">
                                            {user?.user_metadata?.avatar_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedAvatar(null)}
                                                    className={`relative h-14 w-14 rounded-full overflow-hidden shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg ${selectedAvatar === null
                                                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                                                        : 'hover:ring-2 hover:ring-muted-foreground/30'
                                                        }`}
                                                    title="Use Profile Photo"
                                                >
                                                    <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                                                    {selectedAvatar === null && (
                                                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            )}
                                            {AVATAR_OPTIONS.map((avatar) => (
                                                <button
                                                    key={avatar.id}
                                                    type="button"
                                                    onClick={() => setSelectedAvatar(avatar.id)}
                                                    className={`relative h-14 w-14 rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-2xl shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg ${selectedAvatar === avatar.id
                                                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                                                        : 'hover:ring-2 hover:ring-muted-foreground/30'
                                                        }`}
                                                >
                                                    {avatar.emoji}
                                                    {selectedAvatar === avatar.id && (
                                                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-primary-foreground" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="displayName">Display Name</Label>
                                            <Input
                                                id="displayName"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                placeholder="Your name"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                value={user?.email || ""}
                                                disabled
                                                className="bg-muted"
                                            />
                                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button onClick={handleUpdateProfile} disabled={saving}>
                                            {saving ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>



                            {/* Danger Zone */}
                            <Card className="bg-card border-destructive/30">
                                <CardHeader>
                                    <CardTitle className="text-destructive flex items-center gap-2">
                                        <Trash2 className="h-5 w-5" />
                                        Danger Zone
                                    </CardTitle>
                                    <CardDescription>Irreversible account actions. Please be careful.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Delete Account</p>
                                            <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Account
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-destructive">Delete Account Forever?</AlertDialogTitle>
                                                    <AlertDialogDescription className="space-y-3">
                                                        <p>This will permanently delete:</p>
                                                        <ul className="list-disc list-inside text-sm space-y-1">
                                                            <li>All your meetings and transcripts</li>
                                                            <li>All your notes and action items</li>
                                                            <li>Your account settings and API keys</li>
                                                        </ul>
                                                        <p className="font-medium text-foreground">This action cannot be undone.</p>
                                                        <div className="pt-2">
                                                            <Label htmlFor="confirm" className="text-sm">Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm:</Label>
                                                            <Input
                                                                id="confirm"
                                                                className="mt-2"
                                                                value={deleteConfirmText}
                                                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                                                placeholder="Type DELETE here"
                                                            />
                                                        </div>
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleDeleteAccount}
                                                        disabled={deleteConfirmText !== "DELETE" || deleting}
                                                        className="bg-destructive hover:bg-destructive/90"
                                                    >
                                                        {deleting ? "Deleting..." : "Delete My Account"}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* API Keys Tab */}
                        {/* Billing Tab */}
                        <TabsContent value="billing" className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <CreditHistory />
                                </div>
                                <div className="md:col-span-2 lg:col-span-1 space-y-6">
                                    <CreditUsageBreakdown />

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Plan Management</CardTitle>
                                            <CardDescription>Troubleshoot your subscription status</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">Missing Pro Status?</p>
                                                    <p className="text-xs text-muted-foreground">If you upgraded but don't see Pro features, try restoring your status.</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        toast.promise(
                                                            (async () => {
                                                                const { syncSubscriptionStatus } = await import("./actions")
                                                                const res = await syncSubscriptionStatus()
                                                                if (!res.success) throw new Error(res.error)
                                                                router.refresh()
                                                                return res.message
                                                            })(),
                                                            {
                                                                loading: 'Syncing status...',
                                                                success: (msg) => `${msg}`,
                                                                error: (err) => `Failed: ${err.message}`
                                                            }
                                                        )
                                                    }}
                                                >
                                                    Restore Plan
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="md:col-span-2 lg:col-span-1">
                                    <Card className="h-full">
                                        <CardHeader>
                                            <CardTitle>Payment Method</CardTitle>
                                            <CardDescription>Manage your saved cards</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4 h-[200px]">
                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-medium">No payment methods</h4>
                                                <p className="text-sm text-muted-foreground">Add a card to purchase credits faster</p>
                                            </div>
                                            <Button variant="outline" size="sm" disabled>Add Card (Coming Soon)</Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* API Keys Tab */}
                        <TabsContent value="api" className="space-y-6">
                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle>API Configuration</CardTitle>
                                    <CardDescription>
                                        Manage your external API keys. Your keys are stored encrypted.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {settings && <SettingsForm settings={settings} />}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Integrations Tab */}
                        <TabsContent value="integrations" className="space-y-6">
                            {integrationsStatus && <IntegrationsCard initialStatus={integrationsStatus} />}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
