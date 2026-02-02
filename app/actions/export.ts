'use server'
import { createClient } from "@/lib/supabase/server"
import { Client } from "@notionhq/client"
import { Client as GraphClient } from "@microsoft/microsoft-graph-client"

export async function exportToNotion(meetingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const { data: settings } = await supabase.from('user_settings').select('notion_access_token').eq('user_id', user.id).single()
    if (!settings?.notion_access_token) return { success: false, error: "Not connected to Notion" }

    const { data: meeting } = await supabase.from('meetings').select('*').eq('id', meetingId).single()
    if (!meeting) return { success: false, error: "Meeting not found" }

    try {
        const notion = new Client({ auth: settings.notion_access_token })

        const search = await notion.search({ filter: { value: 'page', property: 'object' } })
        const parentId = search.results[0]?.id

        if (!parentId) return { success: false, error: "No editable Notion pages found. Please share a page with the integration." }

        await notion.pages.create({
            parent: { page_id: parentId },
            properties: {
                title: { title: [{ text: { content: meeting.title || "Meeting Notes" } }] }
            },
            children: [
                {
                    heading_1: { rich_text: [{ text: { content: "Executive Summary" } }] }
                },
                {
                    paragraph: { rich_text: [{ text: { content: meeting.summary || "No summary" } }] }
                },
                ...(meeting.action_items?.map((item: string) => ({
                    to_do: {
                        rich_text: [{ text: { content: item } }]
                    }
                })) || [])
            ]
        })

        return { success: true }
    } catch (e: any) {
        console.error(e)
        return { success: false, error: e.message }
    }
}

export async function exportToOneNote(meetingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const { data: settings } = await supabase.from('user_settings').select('onenote_access_token').eq('user_id', user.id).single()
    if (!settings?.onenote_access_token) return { success: false, error: "Not connected to OneNote" }

    const { data: meeting } = await supabase.from('meetings').select('*').eq('id', meetingId).single()
    if (!meeting) return { success: false, error: "Meeting not found" }

    try {
        const client = GraphClient.init({
            authProvider: (done) => done(null, settings.onenote_access_token)
        })

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${meeting.title}</title>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        </head>
        <body>
            <h1>${meeting.title}</h1>
            <h2>Executive Summary</h2>
            <p>${meeting.summary}</p>
            <h2>Action Items</h2>
            <ul>
                ${meeting.action_items?.map((item: string) => `<li>${item}</li>`).join('') || ''}
            </ul>
        </body>
        </html>
        `

        await client.api('/me/onenote/pages')
            .header('Content-Type', 'text/html')
            .post(html)

        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
