import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code")
    if (!code) return redirect("/settings?error=no_code")

    try {
        const params = new URLSearchParams()
        params.append('client_id', process.env.MICROSOFT_CLIENT_ID!)
        params.append('scope', 'offline_access user.read notes.create')
        params.append('code', code)
        params.append('redirect_uri', process.env.MICROSOFT_REDIRECT_URI!)
        params.append('grant_type', 'authorization_code')
        params.append('client_secret', process.env.MICROSOFT_CLIENT_SECRET!)

        const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        })

        const data = await response.json()
        if (data.error) {
            console.error("Microsoft Auth Error:", data)
            return redirect("/settings?error=microsoft_auth_failed")
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            await supabase.from('user_settings').upsert({
                user_id: user.id,
                onenote_access_token: data.access_token,
                updated_at: new Date().toISOString()
            })
        }

        redirect("/settings?success=microsoft_connected")
    } catch (e) {
        console.error(e)
        redirect("/settings?error=server_error")
    }
}
