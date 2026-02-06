"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateProfile } from "@/app/actions"
import { toast } from "sonner"
import { Loader2, User } from "lucide-react"

// Gradient Avatars
const AVATARS = [
    "bg-gradient-to-br from-red-500 to-orange-500",
    "bg-gradient-to-br from-amber-500 to-yellow-500",
    "bg-gradient-to-br from-lime-500 to-green-500",
    "bg-gradient-to-br from-emerald-500 to-teal-500",
    "bg-gradient-to-br from-cyan-500 to-sky-500",
    "bg-gradient-to-br from-blue-500 to-indigo-500",
    "bg-gradient-to-br from-violet-500 to-purple-500",
    "bg-gradient-to-br from-fuchsia-500 to-pink-500",
]

interface ProfileFormProps {
    user: any
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState(user?.user_metadata?.full_name || "")
    const [selectedAvatar, setSelectedAvatar] = useState(user?.user_metadata?.avatar_url || AVATARS[5])

    async function handleSubmit() {
        setIsLoading(true)
        const formData = new FormData()
        formData.append('full_name', name)
        formData.append('avatar', selectedAvatar)

        try {
            const res = await updateProfile(formData)
            if (res.success) {
                toast.success("Profile updated successfully")
            } else {
                toast.error("Failed to update profile: " + res.error)
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                    Manage your public profile and appearance.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Avatar Selection */}
                <div className="space-y-2">
                    <Label>Avatar</Label>
                    <div className="flex flex-wrap gap-3">
                        {AVATARS.map((bgClass) => (
                            <button
                                key={bgClass}
                                onClick={() => setSelectedAvatar(bgClass)}
                                className={`w-12 h-12 rounded-full ${bgClass} transition-all duration-200 border-2 ${selectedAvatar === bgClass ? "border-white ring-2 ring-indigo-500 scale-110" : "border-transparent hover:scale-105"}`}
                                type="button"
                            />
                        ))}
                    </div>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                    <Label htmlFor="full_name">Display Name</Label>
                    <Input
                        id="full_name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                    />
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                        value={user?.email || ""}
                        disabled
                        className="bg-muted text-muted-foreground"
                    />
                </div>

                <div className="pt-4">
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>

            </CardContent>
        </Card>
    )
}
