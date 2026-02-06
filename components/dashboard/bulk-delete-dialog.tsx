"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { bulkDeleteMeetings } from "@/app/actions/bulk"
import { toast } from "sonner"
import { useState } from "react"
import { Loader2 } from "lucide-react"

interface BulkDeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    meetingIds: string[]
    onSuccess: () => void
}

export function BulkDeleteDialog({ open, onOpenChange, meetingIds, onSuccess }: BulkDeleteDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const result = await bulkDeleteMeetings(meetingIds)
            if (result.success) {
                toast.success(`Deleted ${meetingIds.length} meetings`)
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(result.error || "Failed to delete meetings")
            }
        } catch (error) {
            toast.error("Failed to delete meetings")
            console.error(error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {meetingIds.length} meetings?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the selected meetings and their transcripts. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                        disabled={isDeleting}
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete All
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
