"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Search,
    Plus,
    Folder,
    MoreVertical,
    Star,
    FileText,
    LayoutGrid,
    Clock,
    Palette,
    Book,
    Settings,
    Bell,
    User,
    ChevronLeft,
    Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'

export default function NotesPage() {
    const supabase = createClient()
    const router = useRouter()

    // State
    const [folders, setFolders] = useState<any[]>([])
    const [notes, setNotes] = useState<any[]>([])
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Create Folder State
    const [newFolderName, setNewFolderName] = useState('')
    const [creatingFolder, setCreatingFolder] = useState(false)
    const [openFolderDialog, setOpenFolderDialog] = useState(false)

    // Create Note State
    const [newNoteTitle, setNewNoteTitle] = useState('')
    const [newNoteContent, setNewNoteContent] = useState('')
    const [creatingNote, setCreatingNote] = useState(false)
    const [openNoteDialog, setOpenNoteDialog] = useState(false)

    // Initial Fetch
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch Folders
            const { data: foldersData } = await supabase
                .from('folders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (foldersData) setFolders(foldersData)

            // Fetch All Notes (for counts and search)
            const { data: notesData } = await supabase
                .from('notes')
                .select('*, folder_id')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })

            if (notesData) setNotes(notesData)

        } catch (error) {
            console.error("Error fetching notes data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return

        setCreatingFolder(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data, error } = await supabase
                .from('folders')
                .insert([
                    {
                        user_id: user.id,
                        name: newFolderName,
                        color: 'bg-blue-500/10 text-blue-500',
                        icon: 'Folder'
                    }
                ])
                .select()

            if (data) {
                setFolders([data[0], ...folders])
                setOpenFolderDialog(false)
                setNewFolderName('')
            }
        }
        setCreatingFolder(false)
    }

    const handleCreateNote = async () => {
        if (!newNoteTitle.trim() || !selectedFolderId) return

        setCreatingNote(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data, error } = await supabase
                .from('notes')
                .insert([
                    {
                        user_id: user.id,
                        folder_id: selectedFolderId,
                        title: newNoteTitle,
                        content: newNoteContent,
                    }
                ])
                .select()

            if (data) {
                setNotes([data[0], ...notes])
                setOpenNoteDialog(false)
                setNewNoteTitle('')
                setNewNoteContent('')
            } else if (error) {
                console.error("Error creating note:", error)
            }
        }
        setCreatingNote(false)
    }

    // Derived State
    const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))

    // Calculate folder counts locally
    const getFolderCount = (folderId: string) => notes.filter(n => n.folder_id === folderId).length

    // View Logic
    const currentViewNotes = selectedFolderId
        ? notes.filter(n => n.folder_id === selectedFolderId)
        : []

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground">
            {/* Left Sidebar (Library Tree) */}
            <div className="w-64 border-r border-[#1F2128] bg-[#0F1116] flex flex-col shrink-0 hidden md:flex">
                <div className="p-4 flex items-center gap-2 border-b border-[#1F2128]">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Book className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-lg text-zinc-100">Notes Library</span>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
                    <div>
                        <h4 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Library Tree</h4>
                        <nav className="space-y-1">
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedFolderId(null)}
                                className={cn("w-full justify-start text-zinc-300 hover:text-white hover:bg-white/5", !selectedFolderId && "bg-blue-600/10 text-blue-500")}
                            >
                                <Folder className={cn("mr-2 h-4 w-4", !selectedFolderId ? "text-blue-500" : "text-zinc-500")} />
                                My Workspace
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-zinc-300 hover:text-white hover:bg-white/5">
                                <FileText className="mr-2 h-4 w-4" /> All Notes
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-zinc-300 hover:text-white hover:bg-white/5">
                                <Star className="mr-2 h-4 w-4" /> Favorites
                            </Button>
                        </nav>
                    </div>

                    <div>
                        <h4 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Folders</h4>
                        <nav className="space-y-1">
                            {folders.map(folder => (
                                <Button
                                    key={folder.id}
                                    variant="ghost"
                                    onClick={() => setSelectedFolderId(folder.id)}
                                    className={cn("w-full justify-start text-zinc-300 hover:text-white hover:bg-white/5", selectedFolderId === folder.id && "bg-blue-600/10 text-blue-500")}
                                >
                                    <Folder className={cn("mr-2 h-4 w-4", selectedFolderId === folder.id ? "text-blue-500" : "text-zinc-500")} />
                                    <span className="truncate">{folder.name}</span>
                                </Button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0F1116]">
                {/* Header */}
                <div className="p-6 lg:p-8 pb-0">
                    <div className="flex flex-col gap-1 mb-6">
                        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                            <span onClick={() => setSelectedFolderId(null)} className="cursor-pointer hover:text-zinc-300 transition-colors">My Workspace</span>
                            {selectedFolderId && (
                                <>
                                    <span>/</span>
                                    <span className="text-zinc-200">{folders.find(f => f.id === selectedFolderId)?.name}</span>
                                </>
                            )}
                            {!selectedFolderId && (
                                <>
                                    <span>/</span>
                                    <span className="text-zinc-200">Notebooks & Folders</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : "Notebooks & Folders"}
                        </h1>
                        <p className="text-zinc-400">
                            {selectedFolderId
                                ? `${currentViewNotes.length} notes in this folder`
                                : "Organize and manage your meeting intelligence efficiently."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                        {selectedFolderId && (
                            <Button variant="outline" size="icon" onClick={() => setSelectedFolderId(null)} className="mr-2 shrink-0 md:hidden">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder={selectedFolderId ? "Search in this folder..." : "Search by title or tag..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 bg-[#1F2128] border-0 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                            />
                        </div>

                        {!selectedFolderId ? (
                            <Dialog open={openFolderDialog} onOpenChange={setOpenFolderDialog}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 whitespace-nowrap">
                                        <Plus className="mr-2 h-4 w-4" /> New Notebook
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] bg-[#1F2128] border-zinc-800 text-zinc-100">
                                    <DialogHeader>
                                        <DialogTitle>Create New Notebook</DialogTitle>
                                        <DialogDescription className="text-zinc-400">
                                            Organize your notes into a new notebook (folder).
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="name" className="text-right text-zinc-300">
                                                Name
                                            </Label>
                                            <Input
                                                id="name"
                                                value={newFolderName}
                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                placeholder="e.g. Q3 Roadmap"
                                                className="col-span-3 bg-[#0F1116] border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={handleCreateFolder}
                                            disabled={creatingFolder || !newFolderName.trim()}
                                            className="bg-blue-600 hover:bg-blue-500 text-white"
                                        >
                                            {creatingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Create Notebook
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Dialog open={openNoteDialog} onOpenChange={setOpenNoteDialog}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 whitespace-nowrap">
                                        <Plus className="mr-2 h-4 w-4" /> New Note
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px] bg-[#1F2128] border-zinc-800 text-zinc-100">
                                    <DialogHeader>
                                        <DialogTitle>Create New Note</DialogTitle>
                                        <DialogDescription className="text-zinc-400">
                                            Add a new note to this folder.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="title" className="text-zinc-300">
                                                Title
                                            </Label>
                                            <Input
                                                id="title"
                                                value={newNoteTitle}
                                                onChange={(e) => setNewNoteTitle(e.target.value)}
                                                placeholder="Meeting notes..."
                                                className="bg-[#0F1116] border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="content" className="text-zinc-300">
                                                Content
                                            </Label>
                                            <Textarea
                                                id="content"
                                                value={newNoteContent}
                                                onChange={(e) => setNewNoteContent(e.target.value)}
                                                placeholder="Start typing..."
                                                className="min-h-[150px] bg-[#0F1116] border-zinc-700 text-zinc-100 placeholder:text-zinc-600 resize-none"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={handleCreateNote}
                                            disabled={creatingNote || !newNoteTitle.trim()}
                                            className="bg-blue-600 hover:bg-blue-500 text-white"
                                        >
                                            {creatingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Create Note
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                {/* Content Grid - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                        </div>
                    ) : (
                        <>
                            {/* ROOT VIEW: Folder Cards */}
                            {!selectedFolderId && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredFolders.map(folder => (
                                        <div
                                            key={folder.id}
                                            onClick={() => setSelectedFolderId(folder.id)}
                                            className="bg-card border border-border/50 rounded-xl p-0 flex flex-col h-[320px] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-500/30 group"
                                        >
                                            {/* Card Header */}
                                            <div className="p-4 flex items-center justify-between border-b border-border/50 bg-[#14161B] group-hover:bg-[#1A1D24] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-colors", folder.color || "bg-zinc-800 text-zinc-400")}>
                                                        <Folder className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{folder.name}</h3>
                                                        <p className="text-xs text-zinc-500">{getFolderCount(folder.id)} notes</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-300">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {/* Notes Preview List (Max 3-4) */}
                                            <div className="p-4 space-y-3 flex-1 bg-[#0F1116] overflow-hidden relative">
                                                {notes.filter(n => n.folder_id === folder.id).slice(0, 3).map(note => (
                                                    <div key={note.id} className="p-3 rounded-lg border border-[#1F2128] bg-[#14161B] hover:bg-[#1A1D24] transition-colors">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-medium text-sm text-zinc-300 truncate pr-2">{note.title}</h4>
                                                            <span className="text-[10px] text-zinc-500 shrink-0">
                                                                {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-zinc-500 line-clamp-1">{note.content || "No preview available"}</p>
                                                    </div>
                                                ))}
                                                {getFolderCount(folder.id) > 3 && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0F1116] to-transparent flex items-end justify-center pb-2">
                                                        <span className="text-xs text-zinc-500 font-medium">+{getFolderCount(folder.id) - 3} more</span>
                                                    </div>
                                                )}
                                                {getFolderCount(folder.id) === 0 && (
                                                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2 opacity-50">
                                                        <FileText className="h-6 w-6" />
                                                        <span className="text-xs">Empty Folder</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Create New Folder Card */}
                                    <div
                                        onClick={() => setOpenFolderDialog(true)}
                                        className="border border-dashed border-[#1F2128] rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white/5 transition-colors group h-[320px]"
                                    >
                                        <div className="h-16 w-16 rounded-full bg-[#1F2128] group-hover:bg-[#2A2D36] flex items-center justify-center mb-4 transition-colors">
                                            <Plus className="h-8 w-8 text-zinc-500 group-hover:text-zinc-300" />
                                        </div>
                                        <h3 className="font-semibold text-zinc-300 mb-1">Create New Notebook</h3>
                                        <p className="text-xs text-zinc-500 text-center max-w-[200px]">Organize your notes into new collections</p>
                                    </div>
                                </div>
                            )}

                            {/* DETAIL VIEW: Notes List inside Folder */}
                            {selectedFolderId && (
                                <div className="space-y-4">
                                    {currentViewNotes.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {currentViewNotes.map(note => (
                                                <div key={note.id} className="group p-4 rounded-xl border border-[#1F2128] bg-[#14161B] hover:border-blue-500/30 transition-all cursor-pointer flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors truncate">{note.title}</h3>
                                                            {note.is_favorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                                        </div>
                                                        <p className="text-sm text-zinc-500 line-clamp-2 sm:line-clamp-1">{note.content || "No additional text content..."}</p>
                                                    </div>

                                                    <div className="flex items-center gap-6 shrink-0 text-xs text-zinc-500">
                                                        <span className="flex items-center gap-1.5 bg-[#1F2128] px-2 py-1 rounded-md">
                                                            <Clock className="h-3 w-3" />
                                                            Last edited {new Date(note.updated_at).toLocaleDateString()}
                                                        </span>
                                                        <div className="flex -space-x-2">
                                                            {/* Mock avatars for now since we don't store authors yet */}
                                                            <div className="h-6 w-6 rounded-full bg-indigo-500 border-2 border-[#14161B]" />
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-[#1F2128] rounded-xl bg-white/5">
                                            <div className="h-12 w-12 rounded-full bg-[#1F2128] flex items-center justify-center mb-4">
                                                <FileText className="h-6 w-6 text-zinc-500" />
                                            </div>
                                            <h3 className="text-lg font-medium text-zinc-300">No notes yet</h3>
                                            <p className="text-sm text-zinc-500 max-w-sm mt-1 mb-6">Start capturing your ideas and meeting insights in this folder.</p>
                                            <Button
                                                onClick={() => setOpenNoteDialog(true)}
                                                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                            >
                                                <Plus className="mr-2 h-4 w-4" /> Create First Note
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
