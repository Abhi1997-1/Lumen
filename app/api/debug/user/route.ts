import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        // Check if we have the required environment variables
        const envCheck = {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({
                error: "Missing environment variables",
                envCheck
            }, { status: 500 })
        }

        // Get current user
        const supabase = await createServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({
                error: "Not authenticated",
                userError: userError?.message
            }, { status: 401 })
        }

        // Use admin client to check settings
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single()

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata
            },
            settings: settings || null,
            settingsError: settingsError?.message || null,
            envCheck,
            isAdmin: !!settings?.is_admin,
            computedData: {
                credits: settings?.credits_remaining || 0,
                tier: settings?.tier || 'free',
                hasApiKey: !!settings?.gemini_api_key,
                isAdmin: !!settings?.is_admin
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
