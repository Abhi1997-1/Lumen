"use strict";
"use client";

import { useState } from "react";
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MeetingProcessing } from '@/components/meeting-processing'
import { ActionItemChecklist } from '@/components/action-item-checklist'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { TranscriptView } from '@/components/transcript-view'
import { AiChatBar } from '@/components/ai-chat-bar'
import { ModeToggle } from "@/components/theme-toggle"
import {
    Calendar,
    Clock,
    Users,
    Sparkles,
    FileText,
    Wand2,
    MessageSquare,
    Share2,
    Download,
    CheckSquare,
    ChevronLeft,
    MoreHorizontal,
    Bold,
    Italic,
    Underline,
    List,
    Link as LinkIcon,
    Languages,
    Loader2,
    ArrowLeft
} from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { translateMeeting } from "@/app/actions";
import { toast } from "sonner";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportMeetingToProvider } from "@/app/actions/export"

interface MeetingViewProps {
    meeting: any;
    user: any;
}

const LANGUAGES = [
    { value: "English", label: "English" },
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Chinese", label: "Chinese" },
    { value: "Japanese", label: "Japanese" },
    { value: "Hindi", label: "Hindi" },
    { value: "Portuguese", label: "Portuguese" },
];

export function MeetingView({ meeting, user }: MeetingViewProps) {
    const [language, setLanguage] = useState("English");
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedData, setTranslatedData] = useState<any>(null);

    const currentMeeting = translatedData || meeting;

    const handleLanguageChange = async (newLang: string) => {
        if (newLang === language) return;

        setLanguage(newLang);
        if (newLang === "English") {
            setTranslatedData(null);
            return;
        }

        setIsTranslating(true);
        try {
            const result = await translateMeeting(meeting.id, newLang);
            if (result.success && result.data) {
                setTranslatedData({
                    ...meeting,
                    summary: result.data.summary,
                    action_items: result.data.action_items,
                    transcript: result.data.transcript
                });
                toast.success(`Translated to ${newLang}`);
            } else {
                toast.error(result.error || "Translation failed");
                setLanguage("English");
            }
        } catch (error) {
            toast.error("Translation failed");
            setLanguage("English");
        } finally {
            setIsTranslating(false);
        }
    };

    const handleExport = async (provider: 'notion' | 'onenote') => {
        const toastId = toast.loading(`Exporting to ${provider === 'notion' ? 'Notion' : 'OneNote'}...`)
        try {
            const result = await exportMeetingToProvider(meeting.id, provider)
            if (result.success) {
                toast.success('Export successful!', { id: toastId })
            } else {
                toast.error(result.error || 'Export failed', { id: toastId })
            }
        } catch (error) {
            toast.error('Export failed', { id: toastId })
        }
    }

    if (!meeting.transcript && !meeting.summary) {
        return <div className="p-8"><MeetingProcessing /></div>
    }

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground">

            {/* LEFT COLUMN: AI Assistant Tools (Hidden by default on smaller screens) */}
            <div className="hidden 2xl:flex w-[300px] flex-col border-r border-border/40 bg-card/30 shrink-0">
                <div className="p-4 border-b border-border/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-400" />
                        <h2 className="font-semibold text-lg tracking-tight">AI Assistant</h2>
                    </div>
                    <ModeToggle />
                </div>

                <div className="p-4 space-y-3 overflow-y-auto flex-1">
                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-indigo-300">Analysis Complete</p>
                                <p className="text-xs text-muted-foreground">
                                    I&apos;ve identified 3 potential risks in the timeline discussion. Should I highlight them?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3 ml-11">
                            <Button size="sm" variant="secondary" className="h-7 text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border-0">Yes, highlight</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs hover:text-foreground">Ignore</Button>
                        </div>
                    </div>

                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6">Quick Actions</p>
                    <Button variant="outline" className="w-full justify-start h-9 text-sm font-normal text-muted-foreground hover:text-foreground">
                        <FileText className="mr-2 h-4 w-4" /> Summarize into key points
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-9 text-sm font-normal text-muted-foreground hover:text-foreground">
                        <CheckSquare className="mr-2 h-4 w-4" /> Extract technical specs
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-9 text-sm font-normal text-muted-foreground hover:text-foreground">
                        <Wand2 className="mr-2 h-4 w-4" /> Make tone more formal
                    </Button>

                    <div className="mt-auto pt-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ask AI to edit or generate..."
                                className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-7 w-7 text-indigo-400 hover:text-indigo-300">
                                <Sparkles className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CENTER COLUMN: Main Content (Document) */}
            <div className="flex-1 flex flex-col min-w-0 bg-background relative transition-opacity duration-300">
                {isTranslating && (
                    <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            <p className="text-sm font-medium text-foreground">Translating meeting content...</p>
                        </div>
                    </div>
                )}

                {/* Visualizer / Audio Player Placeholder (Optional) */}
                <div className="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-card/50">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/meetings">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-foreground transition-colors" title="Back to Meetings">
                                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </Link>
                        <div className="h-8 w-[1px] bg-border mx-2" />
                        <h1 className="text-sm font-medium text-foreground truncate max-w-[300px]">
                            {currentMeeting.title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={language} onValueChange={handleLanguageChange} disabled={isTranslating}>
                            <SelectTrigger className="w-[130px] h-8 bg-background border-border text-xs gap-1">
                                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                                <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border text-foreground">
                                {LANGUAGES.map(lang => (
                                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 bg-indigo-500/10 ml-2">
                            Processed
                        </Badge>
                    </div>
                </div>

                {/* Document Canvas */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:px-16 max-w-5xl mx-auto w-full">
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header */}
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2 leading-tight">
                                {currentMeeting.title}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(currentMeeting.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {new Date(currentMeeting.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        {/* Summary Section */}
                        {currentMeeting.summary && (
                            <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 shadow-2xl shadow-indigo-900/10">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                                <div className="relative bg-card/90 backdrop-blur-3xl rounded-2xl p-8 border border-border h-full">
                                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                                        AI Executive Summary
                                    </h3>
                                    <p className="text-foreground leading-relaxed text-lg font-light">
                                        {currentMeeting.summary}
                                    </p>
                                </div>
                            </div>
                        )}


                        {/* Transcript Section - NOW INTERACTIVE */}
                        <TranscriptView originalTranscript={currentMeeting.transcript || ''} />

                    </div>
                </div>
            </div>

            {/* Chat Bar */}
            <AiChatBar context={`Meeting Title: ${currentMeeting.title}\n\nSummary:\n${currentMeeting.summary}\n\nTranscript:\n${currentMeeting.transcript}`} />

            {/* RIGHT COLUMN: Action Items Sidebar (Hidden on tablets) */}
            <div className="hidden lg:flex w-[350px] border-l border-border/40 bg-card/30 flex-col shrink-0">
                <div className="p-4 border-b border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-emerald-500" />
                        <h2 className="font-semibold text-lg tracking-tight">Action Items</h2>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-0 font-medium">
                        {currentMeeting.action_items?.length || 0} Open
                    </Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {currentMeeting.action_items && currentMeeting.action_items.map((item: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl border border-white/5 bg-card hover:border-indigo-500/30 hover:bg-accent/50 transition-all group shadow-sm hover:shadow-md">
                            <div className="flex items-start gap-4">
                                <Checkbox className="mt-1.5 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 border-zinc-700" />
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm text-foreground leading-relaxed font-medium">{typeof item === 'string' ? item : item.text}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6 border border-border">
                                                <AvatarFallback className="text-[9px] bg-indigo-500/20 text-indigo-300">AI</AvatarFallback>
                                            </Avatar>
                                            <span className="text-[11px] text-muted-foreground">Suggested Action</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <Button variant="ghost" className="w-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border h-10 mt-2">
                        <PlusIcon className="mr-2 h-4 w-4" /> Add Action Item
                    </Button>
                </div>

                <div className="p-4 border-t border-border/40 bg-background">
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex-1 bg-secondary border-border hover:bg-accent text-foreground">
                                    <ExportIcon className="mr-2 h-4 w-4" /> Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                                    <span className="font-serif mr-2 font-bold">N</span> Notion (Coming Soon)
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                                    <span className="mr-2 font-bold text-[#7719aa]">N</span> OneNote (Coming Soon)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0">
                            <ShareIcon className="mr-2 h-4 w-4" /> Share
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PlusIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

function ShareIcon(props: any) {
    return <Share2 {...props} />
}

function ExportIcon(props: any) {
    return <Download {...props} />
}
