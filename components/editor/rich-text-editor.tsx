"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Link as LinkIcon,
    Image as ImageIcon,
    Undo,
    Redo
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    editable?: boolean
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null
    }

    return (
        <div className="flex items-center gap-1 p-2 border-b border-[#1F2128] bg-[#0F1116] flex-wrap sticky top-0 z-10">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('bold') && "bg-indigo-500/20 text-indigo-400")}
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('italic') && "bg-indigo-500/20 text-indigo-400")}
            >
                <Italic className="h-4 w-4" />
            </Button>

            <div className="w-px h-4 bg-[#1F2128] mx-1" />

            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('heading', { level: 1 }) && "bg-indigo-500/20 text-indigo-400")}
            >
                <Heading1 className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('heading', { level: 2 }) && "bg-indigo-500/20 text-indigo-400")}
            >
                <Heading2 className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('heading', { level: 3 }) && "bg-indigo-500/20 text-indigo-400")}
            >
                <Heading3 className="h-4 w-4" />
            </Button>

            <div className="w-px h-4 bg-[#1F2128] mx-1" />

            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('bulletList') && "bg-indigo-500/20 text-indigo-400")}
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('orderedList') && "bg-indigo-500/20 text-indigo-400")}
            >
                <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('taskList') && "bg-indigo-500/20 text-indigo-400")}
            >
                <CheckSquare className="h-4 w-4" />
            </Button>

            <div className="w-px h-4 bg-[#1F2128] mx-1" />

            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('blockquote') && "bg-indigo-500/20 text-indigo-400")}
            >
                <Quote className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('codeBlock') && "bg-indigo-500/20 text-indigo-400")}
            >
                <Code className="h-4 w-4" />
            </Button>

            <div className="w-px h-4 bg-[#1F2128] mx-1" />

            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    const url = window.prompt('URL')
                    if (url) {
                        editor.chain().focus().setLink({ href: url }).run()
                    }
                }}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('link') && "bg-indigo-500/20 text-indigo-400")}
            >
                <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    const url = window.prompt('Image URL')
                    if (url) {
                        editor.chain().focus().setImage({ src: url }).run()
                    }
                }}
                className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5", editor.isActive('image') && "bg-indigo-500/20 text-indigo-400")}
            >
                <ImageIcon className="h-4 w-4" />
            </Button>

            <div className="flex-1" />

            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
            >
                <Undo className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
            >
                <Redo className="h-4 w-4" />
            </Button>
        </div>
    )
}

import Heading from '@tiptap/extension-heading'

// ... (other imports)

export function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // Disable default heading to use custom configuration
            }),
            Heading.configure({
                levels: [1, 2, 3],
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Placeholder.configure({
                placeholder: 'Type something...',
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: content,
        editable: editable,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px]',
            },
        },
    })

    // Update content if it changes externally (and isn't the same)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Avoid loop if content is similar enough or we are typing
            // Simple check for now, though often requires deep equal or manual compare
            // For this basic flow, we trust content updates from parent are deliberate (e.g. note switch)
            if (editor.getText() === "" && content) {
                editor.commands.setContent(content)
            }
            // NOTE: Real-time syncing usually needs YJS or smarter diffs. 
            // Currently this `useEffect` might cause cursor jumps if we sync violently. 
            // We'll rely on the parent (NotesView) to only change `content` prop when switching notes.
        }
    }, [content, editor])

    // Hard set content when note ID changes (handled by parent passing distinct content strings)
    // Actually, to handle switching notes cleanly:
    useEffect(() => {
        if (editor && content) {
            // Only force update if the content is drastically different (i.e. different note loaded)
            // A primitive way is to check if we should reset.
            // Better pattern: Parent creates a NEW key for Editor when noteId changes.
        }
    }, [])

    if (!editor) {
        return null
    }

    return (
        <div className="flex flex-col h-full bg-[#0F1116] border border-[#1F2128] rounded-lg overflow-hidden">
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
