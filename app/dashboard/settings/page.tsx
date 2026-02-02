import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSettings } from "./actions"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
    const settings = await getSettings()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>

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
        </div>
    )
}
