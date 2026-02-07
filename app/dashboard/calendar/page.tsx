"use client"

import { useState, useEffect } from 'react'
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addDays,
    addWeeks,
    subWeeks,
    startOfDay,
    endOfDay
} from 'date-fns'
import { ChevronLeft, ChevronRight, MoreHorizontal, Clock, Users, X, PanelRightClose, PanelRightOpen, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [meetings, setMeetings] = useState<any[]>([])
    const [activeId, setActiveId] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [view, setView] = useState<'month' | 'week' | 'day'>('month')
    const router = useRouter()
    const supabase = createClient()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const fetchMeetings = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('meetings')
                .select('*')
                .eq('user_id', user.id)

            if (data) {
                const mapped = data.map(m => ({
                    ...m,
                    date: new Date(m.created_at),
                    status: m.transcript ? 'processed' : 'processing',
                    type: 'general'
                }))
                setMeetings(mapped)
            }
        }
        fetchMeetings()
    }, [])

    if (!mounted) return null

    const getCalendarRange = () => {
        if (view === 'month') {
            const monthStart = startOfMonth(currentDate)
            const monthEnd = endOfMonth(monthStart)
            const startDate = startOfWeek(monthStart)
            const endDate = endOfWeek(monthEnd)
            return eachDayOfInterval({ start: startDate, end: endDate })
        } else if (view === 'week') {
            const startDate = startOfWeek(currentDate)
            const endDate = endOfWeek(currentDate)
            return eachDayOfInterval({ start: startDate, end: endDate })
        } else {
            return [currentDate]
        }
    }

    const calendarDays = getCalendarRange()

    const next = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
        else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
        else setCurrentDate(addDays(currentDate, 1))
    }

    const prev = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
        else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
        else setCurrentDate(addDays(currentDate, -1))
    }

    const goToToday = () => {
        const today = new Date()
        setCurrentDate(today)
        setSelectedDate(today)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const dateStr = over.id as string
            const newDate = new Date(dateStr)

            setMeetings(meetings.map(m =>
                m.id === active.id ? { ...m, date: newDate } : m
            ))
        }
        setActiveId(null)
    }

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id)
    }

    const sidebarMeetings = meetings.filter(m => isSameDay(m.date, selectedDate))

    return (
        <div className="flex flex-col h-full gap-6 p-6 lg:p-8 max-w-[1600px] mx-auto w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
                    <p className="text-muted-foreground mt-1">
                        View your meetings by date
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-row min-h-0 overflow-hidden bg-background text-foreground rounded-xl border border-border shadow-sm">
                <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 bg-card">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                                    <Button variant="ghost" size="icon" onClick={prev} className="h-7 w-7 hover:text-foreground">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={next} className="h-7 w-7 hover:text-foreground">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <h2 className="text-xl font-bold text-foreground tracking-tight min-w-[200px]">
                                    {format(currentDate, view === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')}
                                </h2>
                                <Button variant="outline" size="sm" onClick={goToToday} className="ml-2 h-8 border-border text-xs hover:bg-accent hover:text-accent-foreground">
                                    Today
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex bg-muted/50 rounded-lg p-1 text-xs font-medium">
                                    <button
                                        onClick={() => setView('month')}
                                        className={cn("px-3 py-1.5 rounded-md transition-colors", view === 'month' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        Month
                                    </button>
                                    <button
                                        onClick={() => setView('week')}
                                        className={cn("px-3 py-1.5 rounded-md transition-colors", view === 'week' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        Week
                                    </button>
                                    <button
                                        onClick={() => setView('day')}
                                        className={cn("px-3 py-1.5 rounded-md transition-colors", view === 'day' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        Day
                                    </button>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className={cn("text-muted-foreground hover:text-foreground", sidebarOpen && "text-primary")}
                                >
                                    {sidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>

                        {view === 'month' && (
                            <div className="flex items-center gap-3 px-6 py-3 border-b border-border text-xs bg-muted/10">
                                <span className="text-muted-foreground font-medium">Filter:</span>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer">Processed</Badge>
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20 cursor-pointer">Processing</Badge>
                            </div>
                        )}

                        <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] min-h-0 bg-background overflow-hidden">
                            {view !== 'day' && ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                <div key={day} className="py-3 text-center text-[10px] font-bold text-muted-foreground tracking-wider border-b border-r border-border bg-muted/5">
                                    {day}
                                </div>
                            ))}

                            <div
                                className="col-span-7 grid grid-cols-7 h-full"
                                style={{ gridAutoRows: '1fr' }}
                            >
                                {calendarDays.map((day, dayIdx) => {
                                    const dayStr = day.toISOString();

                                    return (
                                        <DroppableDay
                                            key={dayStr}
                                            id={dayStr}
                                            date={day}
                                            isCurrentMonth={isSameMonth(day, currentDate)}
                                            isToday={isSameDay(day, new Date())}
                                            isSelected={isSameDay(day, selectedDate)}
                                            view={view}
                                            onClick={() => {
                                                setSelectedDate(day)
                                                if (!sidebarOpen) setSidebarOpen(true)
                                            }}
                                        >
                                            {meetings
                                                .filter(m => isSameDay(m.date, day))
                                                .map(meeting => (
                                                    <DraggableMeeting key={meeting.id} meeting={meeting} />
                                                ))}
                                        </DroppableDay>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {sidebarOpen && (
                        <div className="w-[350px] border-l border-border bg-card flex flex-col shrink-0 animate-in slide-in-from-right-10 duration-200">
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-bold text-foreground">{format(selectedDate, 'EEEE, MMM d')}</h3>
                                    <p className="text-sm text-muted-foreground">{sidebarMeetings.length} meetings found</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8 hover:bg-accent hover:text-accent-foreground">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {sidebarMeetings.length > 0 ? (
                                    sidebarMeetings.map(meeting => (
                                        <div key={meeting.id}
                                            onClick={() => router.push(`/dashboard/${meeting.id}`)}
                                            className="bg-muted/30 rounded-xl p-4 border border-border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] h-5 border-0 px-2 uppercase font-bold tracking-wider",
                                                    meeting.status === 'processed' ? "bg-emerald-500/10 text-emerald-500" :
                                                        "bg-yellow-500/10 text-yellow-500"
                                                )}>
                                                    {meeting.status}
                                                </Badge>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <h4 className="font-semibold text-foreground mb-1 truncate">{meeting.title || "Untitled Meeting"}</h4>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(meeting.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <Button className="w-full mt-4 bg-muted group-hover:bg-primary group-hover:text-primary-foreground text-foreground h-8 text-xs transition-colors">
                                                View Details
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
                                        <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                                        <p>No meetings scheduled<br />for this day.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DragOverlay>
                        {activeId ? (
                            <div className="bg-primary text-primary-foreground text-xs p-1.5 rounded-md shadow-xl opacity-90 w-[100px] truncate cursor-grabbing">
                                Meeting...
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    )
}

function DraggableMeeting({ meeting }: { meeting: any }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: meeting.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const colorClass = meeting.status === 'processed'
        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";

    if (isDragging) {
        return <div ref={setNodeRef} style={style} className="opacity-0 h-6"></div>
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "text-[10px] px-2 py-1.5 rounded border cursor-grab hover:brightness-110 active:cursor-grabbing mb-1 transition-colors font-medium truncate",
                colorClass
            )}
        >
            {meeting.title || "Untitled"}
        </div>
    )
}

function DroppableDay({ children, id, date, isCurrentMonth, isToday, isSelected, view, onClick }: any) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={cn(
                "border-r border-b border-border p-2 flex flex-col gap-1 transition-colors relative cursor-pointer",
                view === 'month' && !isCurrentMonth && "bg-muted/10 opacity-50",
                view !== 'day' && "min-h-[100px]",
                view === 'day' && "col-span-7 h-full border-r-0",
                isToday && "bg-primary/5",
                isSelected && "ring-1 ring-inset ring-primary bg-primary/5",
                isOver && "bg-primary/10"
            )}
        >
            <span className={cn(
                "text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                view === 'day' && "w-auto px-2"
            )}>
                {view === 'day' ? format(date, 'EEEE, MMMM d') : format(date, 'd')}
            </span>
            <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                {children}
            </div>
        </div>
    )
}
