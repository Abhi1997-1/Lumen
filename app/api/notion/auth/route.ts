import { redirect } from "next/navigation"

const CLIENT_ID = process.env.NOTION_CLIENT_ID
const REDIRECT_URI = process.env.NOTION_REDIRECT_URI

export async function GET() {
    if (!CLIENT_ID || !REDIRECT_URI) {
        return new Response("Notion Client ID or Redirect URI not configured", { status: 500 })
    }
    const url = `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    redirect(url)
}
