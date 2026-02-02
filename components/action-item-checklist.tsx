'use client'

import { useState, useCallback } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Save, FileText, Calendar as CalendarIcon } from "lucide-react"
import { toast } from 'sonner'
import { updateMeetingActionItems, createNote } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface ActionItemChecklistProps {
    initialItems: string[]
    meetingId: string
}

interface ActionItem {
    id: string
    text: string
    completed: boolean
    dueDate?: Date
}

export function ActionItemChecklist({ initialItems, meetingId }: ActionItemChecklistProps) {
    const router = useRouter()
    // Parse initial items to handle potential existing dates (MVP: just parsing text)
    const [items, setItems] = useState<ActionItem[]>(
        initialItems.map((text, i) => {
            // In a real app we would parse "Item Text [Due: 2023-01-01]" here if needed
            return { id: i.toString(), text, completed: false }
        })
    )
    const [newItemText, setNewItemText] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isMoving, setIsMoving] = useState(false)

    const syncChanges = useCallback(async (newItems: ActionItem[]) => {
        setIsSaving(true)
        // Persist only text for now consistent with current DB schema
        const plainItems = newItems.map(item => {
            let text = item.text
            if (item.dueDate) {
                // We could append date here, but for now lets just save the main text
                // or append it if the user wants to see it in the list view of stored meetings
            }
            return text
        })
        await updateMeetingActionItems(meetingId, plainItems)
        setIsSaving(false)
    }, [meetingId])

    const toggleItem = (id: string) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        )
        setItems(newItems)
    }

    const handleDateChange = (id: string, date: Date | undefined) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, dueDate: date } : item
        )
        setItems(newItems)
    }

    const addItem = () => {
        if (!newItemText.trim()) return
        const newItem: ActionItem = {
            id: Date.now().toString(),
            text: newItemText,
            completed: false
        }
        const newItems = [...items, newItem]
        setItems(newItems)
        setNewItemText('')
        syncChanges(newItems)
    }

    const deleteItem = (id: string) => {
        const newItems = items.filter(item => item.id !== id)
        setItems(newItems)
        syncChanges(newItems)
    }

    const saveManually = () => {
        syncChanges(items)
        toast.success("Action items saved!")
    }

    const handleMoveToNote = async () => {
        const selectedItems = items.filter(i => i.completed)
        if (selectedItems.length === 0) {
            toast.error("Please check items to move to a note.")
            return
        }

        setIsMoving(true)
        try {
            const content = selectedItems.map(i => {
                const dateStr = i.dueDate ? ` (Due: ${format(i.dueDate, 'PP')})` : ''
                return `- ${i.text}${dateStr}`
            }).join('\n')

            const title = `Action Items - ${format(new Date(), 'MMM d, yyyy')}`

            const result = await createNote(title, content)
            if (result.success) {
                toast.success("Note created successfully!")
                router.push('/dashboard/notes')
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to create note: " + error.message)
        } finally {
            setIsMoving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-muted-foreground">Checklist</h4>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={saveManually} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
            <div className="space-y-2">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 group">
                        <Checkbox
                            id={`item-${item.id}`}
                            checked={item.completed}
                            onCheckedChange={() => toggleItem(item.id)}
                        />
                        <div className="flex-1 flex items-center justify-between gap-2">
                            <label
                                htmlFor={`item-${item.id}`}
                                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                            >
                                {item.text}
                            </label>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        size="sm"
                                        className={cn(
                                            "h-7 px-2 text-xs justify-start text-left font-normal w-[110px]",
                                            !item.dueDate && "text-muted-foreground border-dashed"
                                        )}
                                    >
                                        <CalendarIcon className="mr-1 h-3 w-3" />
                                        {item.dueDate ? format(item.dueDate, "MMM d") : "Set Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={item.dueDate}
                                        onSelect={(date) => handleDateChange(item.id, date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteItem(item.id)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
                <Input
                    placeholder="Add a new action item..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                />
                <Button size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="pt-4 border-t mt-4">
                <p className="text-xs text-muted-foreground mb-2">Bulk Actions</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMoveToNote}
                    disabled={isMoving || items.every(i => !i.completed)}
                    className="w-full justify-start"
                >
                    <FileText className="h-4 w-4 mr-2" />
                    {isMoving ? 'Creating Note...' : 'Create Note from Checked Items'}
                </Button>
            </div>
            <p className="text-xs text-muted-foreground italic mt-2">
                * Checked items can be moved to a new Note. Dates are included in the note.
            </p>
        </div>
    )
}
