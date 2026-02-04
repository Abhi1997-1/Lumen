'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Folder, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FolderType {
    id: string
    name: string
    created_at: string
}

export function FolderList({ className }: { className?: string }) {
    const [folders, setFolders] = useState<FolderType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")
    const [editingFolder, setEditingFolder] = useState<FolderType | null>(null)
    const [editName, setEditName] = useState("")
    const supabase = createClient()

    const fetchFolders = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching folders:", error)
        } else {
            setFolders(data || [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchFolders()
    }, [])

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newFolderName.trim()) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('folders')
            .insert({ name: newFolderName, user_id: user.id })
            .select()

        if (error) {
            toast.error("Failed to create folder")
        } else {
            toast.success("Folder created")
            setNewFolderName("")
            setIsCreateOpen(false)
            fetchFolders()
        }
    }

    const handleUpdateFolder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingFolder || !editName.trim()) return

        const { error } = await supabase
            .from('folders')
            .update({ name: editName })
            .eq('id', editingFolder.id)

        if (error) {
            toast.error("Failed to rename folder")
        } else {
            toast.success("Folder renamed")
            setEditingFolder(null)
            fetchFolders()
        }
    }

    const handleDeleteFolder = async (folderId: string) => {
        // Prevent accidental deletion if folder is not empty? 
        // For now standard delete (Postgres 'set null' on meetings handles the link)
        const { error } = await supabase
            .from('folders')
            .delete()
            .eq('id', folderId)

        if (error) {
            toast.error("Failed to delete folder")
        } else {
            toast.success("Folder deleted")
            fetchFolders()
        }
    }

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Folder className="h-4 w-4 text-indigo-500" /> Folders
                </h3>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                            <Plus className="mr-1 h-3 w-3" /> New
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Folder</DialogTitle>
                            <DialogDescription>
                                Group your meetings together for organized access and group chat.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateFolder} className="space-y-4 pt-4">
                            <Input
                                placeholder="Folder Name (e.g. Marketing Syncs)"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                            />
                            <DialogFooter>
                                <Button type="submit">Create Folder</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={!!editingFolder} onOpenChange={(open) => !open && setEditingFolder(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Rename Folder</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateFolder} className="space-y-4 pt-4">
                            <Input
                                placeholder="Folder Name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                            <DialogFooter>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading folders...</div>
            ) : folders.length === 0 ? (
                <div className="text-sm text-muted-foreground italic p-4 border border-dashed rounded-lg text-center">
                    No folders yet. Create one to organize your meetings.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {folders.map(folder => (
                        <div key={folder.id} className="group relative bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-all hover:border-indigo-500/50">
                            <Link href={`/dashboard/folders/${folder.id}`} className="block space-y-2">
                                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                    <Folder className="h-4 w-4" />
                                </div>
                                <div className="font-medium truncate" title={folder.name}>
                                    {folder.name}
                                </div>
                            </Link>

                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <MoreVertical className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                            setEditName(folder.name)
                                            setEditingFolder(folder)
                                        }}>
                                            <Edit2 className="mr-2 h-3 w-3" /> Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-500 focus:text-red-600" onClick={() => handleDeleteFolder(folder.id)}>
                                            <Trash2 className="mr-2 h-3 w-3" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
