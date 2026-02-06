import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSettings } from "./actions"
import { getIntegrationsStatus } from "./integrations-actions"
import { SettingsForm } from "./settings-form"
import { IntegrationsCard } from "@/components/settings/integrations-card"
import { ProfileForm } from "@/components/settings/profile-form"
import { PreferencesForm } from "@/components/settings/preferences-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Parallel fetch
    const [settings, integrationsStatus] = await Promise.all([
        getSettings(),
        getIntegrationsStatus()
    ])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Account</h1>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="api">API & Keys</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <ProfileForm user={user} />
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                    <PreferencesForm />
                </TabsContent>

                <TabsContent value="api" className="space-y-4">
                    <div className="grid gap-6">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle>API Configuration</CardTitle>
                                <CardDescription>
                                    Manage your external API keys. Your keys are stored encrypted.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SettingsForm hasKey={settings?.hasKey || false} />
                            </CardContent>
                        </Card>

                        <IntegrationsCard initialStatus={integrationsStatus} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
