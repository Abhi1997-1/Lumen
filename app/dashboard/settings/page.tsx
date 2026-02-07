import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSettings } from "./actions"
import { getIntegrationsStatus } from "./integrations-actions"
import { SettingsForm } from "./settings-form"
import { IntegrationsCard } from "@/components/settings/integrations-card"

export default async function SettingsPage() {
    const settings = await getSettings()
    // Default fallback if settings is null/undefined (though getSettings handles auth check return)
    const validSettings = settings || {
        hasGeminiKey: false,
        hasOpenAIKey: false,
        hasGroqKey: false,
        selectedProvider: 'gemini'
    }
    const integrationsStatus = await getIntegrationsStatus()

    return (
        <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-4xl mx-auto w-full">
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
                        <SettingsForm settings={validSettings} />
                    </CardContent>
                </Card>

                <IntegrationsCard initialStatus={integrationsStatus} />
            </div>
        </div>
    )
}
