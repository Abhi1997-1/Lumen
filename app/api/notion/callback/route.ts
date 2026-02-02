import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code")
    if (!code) return redirect("/settings?error=no_code")

    const encoded = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString("base64")

    try {
        const response = await fetch("https://api.notion.com/v1/oauth/token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Basic ${encoded}`,
            },
            body: JSON.stringify({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.NOTION_REDIRECT_URI,
            }),
        })

        const data = await response.json()
        if (data.error) {
            console.error("Notion Auth Error:", data)
            return redirect("/settings?error=notion_auth_failed")
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            await supabase.from('user_settings').upsert({
                user_id: user.id,
                notion_access_token: data.access_token,
                updated_at: new Date().toISOString()
            })
        }

        redirect("/settings?success=notion_connected")
    } catch (e) {
        console.error(e)
        redirect("/settings?error=server_error")
    }
}
