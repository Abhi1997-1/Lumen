'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FolderInput, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

interface MoveToFolderDialogProps {
    meetingId: string
    currentFolderId?: string | null
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode
}

export function MoveToFolderDialog({ meetingId, currentFolderId, onOpenChange, children }: MoveToFolderDialogProps) {
    const [folders, setFolders] = useState<{ id: string, name: string }[]>([])
    const [selectedFolder, setSelectedFolder] = useState<string>(currentFolderId || "none")
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            const fetchFolders = async () => {
                const { data } = await supabase.from('folders').select('id, name').order('name')
                if (data) setFolders(data)
            }
            fetchFolders()
        }
    }, [isOpen])

    const handleMove = async () => {
        setIsLoading(true)
        const folderIdToSet = selectedFolder === "none" ? null : selectedFolder

        const { error } = await supabase
            .from('meetings')
            .update({ folder_id: folderIdToSet })
            .eq('id', meetingId)

        if (error) {
            toast.error("Failed to move meeting")
        } else {
            toast.success("Meeting moved")
            setIsOpen(false)
            onOpenChange?.(false)
            router.refresh()
        }
        setIsLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            onOpenChange?.(open)
        }}>
            <DialogTrigger asChild>
                {children || (
                    <div className="flex items-center cursor-pointer w-full">
                        <FolderInput className="mr-2 h-4 w-4" />
                        <span>Move to Folder</span>
                    </div>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Move to Folder</DialogTitle>
                    <DialogDescription>
                        Select a folder to organize this meeting.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">
                                <span className="text-muted-foreground italic">No Folder (Remove)</span>
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
                    <Button onClick={handleMove} disabled={isLoading}>
                        {isLoading ? "Moving..." : "Move Meeting"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
