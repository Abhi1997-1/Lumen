'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FolderInput } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { bulkMoveMeetings } from '@/app/actions/bulk'

interface BulkMoveDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    meetingIds: string[]
    onSuccess: () => void
}

export function BulkMoveDialog({ open, onOpenChange, meetingIds, onSuccess }: BulkMoveDialogProps) {
    const [folders, setFolders] = useState<{ id: string, name: string }[]>([])
    const [selectedFolder, setSelectedFolder] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (open) {
            const fetchFolders = async () => {
                const { data } = await supabase.from('folders').select('id, name').order('name')
                if (data) setFolders(data)
            }
            fetchFolders()
        }
    }, [open])

    const handleMove = async () => {
        if (!selectedFolder) {
            toast.error("Please select a folder")
            return
        }

        setIsLoading(true)
        const folderIdToSet = selectedFolder === "none" ? null : selectedFolder

        const result = await bulkMoveMeetings(meetingIds, folderIdToSet)

        if (result.success) {
            toast.success(`Moved ${meetingIds.length} meetings`)
            onSuccess()
            onOpenChange(false)
        } else {
            toast.error(result.error || "Failed to move meetings")
        }
        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Move {meetingIds.length} meetings to...</DialogTitle>
                    <DialogDescription>
                        Select a destination folder for the selected meetings.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">
                                <span className="text-muted-foreground italic">No Folder (Remove from current)</span>
                            </SelectItem>
                            {folders.map(folder => (
                                <SelectItem key={folder.id} value={folder.id}>
                                    {folder.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={handleMove} disabled={isLoading || !selectedFolder}>
                        {isLoading ? "Moving..." : "Move Meetings"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
