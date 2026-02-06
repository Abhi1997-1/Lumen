"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function PreferencesForm() {
    const [autoAnalyze, setAutoAnalyze] = useState(true)
    const [notifications, setNotifications] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    // In a real app, these would fetch from/save to DB
    async function handleSave() {
        setIsLoading(true)
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 800))
        setIsLoading(false)
        toast.success("Preferences saved")
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>
                    Customize your Lumen experience.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                        <Label>Auto-Analyze Meetings</Label>
                        <span className="text-xs text-muted-foreground">
                            Automatically process transcripts when uploading or recording.
                        </span>
                    </div>
                    <Switch checked={autoAnalyze} onCheckedChange={setAutoAnalyze} />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                        <Label>Email Notifications</Label>
                        <span className="text-xs text-muted-foreground">
                            Receive analytical summaries via email.
                        </span>
                    </div>
                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>

                <div className="pt-4">
                    <Button onClick={handleSave} disabled={isLoading} variant="outline">
                        Save Preferences
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
