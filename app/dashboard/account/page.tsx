import { ProfileForm } from "@/components/settings/profile-form"
import { PreferencesForm } from "@/components/settings/preferences-form"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AccountPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    return (
        <div className="flex flex-col gap-8 p-6 lg:p-8 max-w-4xl mx-auto w-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">My Account</h1>
                <p className="text-muted-foreground">Manage your personal details and application preferences.</p>
            </div>

            <div className="grid gap-8">
                {/* Profile Section */}
                <ProfileForm user={user} />

                {/* Preferences Section */}
                <PreferencesForm />
            </div>
        </div>
    )
}
