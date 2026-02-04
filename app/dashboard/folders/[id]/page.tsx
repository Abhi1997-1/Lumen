import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import { MeetingRow } from '@/components/dashboard/meeting-row'
import { Upload } from 'lucide-react'
import { AiFolderChat } from '@/components/folders/ai-folder-chat'

export default async function FolderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: folderId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch folder details
    const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('user_id', user.id)
        .single()

    if (folderError || !folder) {
        redirect('/dashboard/meetings')
    }

    // Fetch meetings in folder
    const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*, status, duration, participants')
        .eq('folder_id', folderId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col h-full gap-6 p-6 lg:p-8 max-w-[1600px] mx-auto w-full overflow-hidden relative">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/meetings">
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{folder.name}</h1>
                        <p className="text-muted-foreground mt-1">
                            {meetings?.length || 0} meetings in this folder
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex-1 overflow-auto custom-scrollbar p-0">
                        {meetings && meetings.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-border">
                                    {meetings.map((meeting) => (
                                        <MeetingRow key={meeting.id} meeting={meeting} />
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                                    <Upload className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg">Empty Folder</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm">
                                        Move meetings here from the "All Meetings" page to organize them.
                                    </p>
                                </div>
                                <Link href="/dashboard/meetings">
                                    <Button>Browse Meetings</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Folder Chat - Only show if there are meetings */}
            {meetings && meetings.length > 0 && (
                <AiFolderChat folderId={folderId} folderName={folder.name} />
            )}
        </div>
    )
}
