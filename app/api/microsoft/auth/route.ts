import { redirect } from "next/navigation"

const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID
const REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI
const SCOPES = "offline_access user.read notes.create"

export async function GET() {
    if (!CLIENT_ID || !REDIRECT_URI) {
        return new Response("Microsoft Client ID or Redirect URI not configured", { status: 500 })
    }
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_mode=query&scope=${encodeURIComponent(SCOPES)}`
    redirect(url)
}
