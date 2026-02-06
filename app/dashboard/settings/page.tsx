import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSettings } from "./actions"
import { getIntegrationsStatus } from "./integrations-actions"
import { SettingsForm } from "./settings-form"
import { IntegrationsCard } from "@/components/settings/integrations-card"

export default async function SettingsPage() {
    const settings = await getSettings()
    const integrationsStatus = await getIntegrationsStatus()

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Usage & Integrations</h1>
                <p className="text-muted-foreground">Manage your API connections and system configurations.</p>
            </div>

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
        </div>
    )
}
