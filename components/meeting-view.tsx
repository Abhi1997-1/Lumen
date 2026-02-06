"use strict";
"use client";

import { useState } from "react";
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PremiumProcessingOverlay } from '@/components/ui/premium-processing-overlay'
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
    ArrowLeft,
    Search
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
import { updateMeetingTitle, updateMeetingNotes, renameSpeakerInTranscript } from "@/app/actions/meeting-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useDebounce } from 'use-debounce';
import { useEffect } from "react"
import { useRouter } from "next/navigation"

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
    const router = useRouter()
    const [language, setLanguage] = useState("English");
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedData, setTranslatedData] = useState<any>(null);

    // New State for Enhancements
    const [title, setTitle] = useState(meeting.title || "");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [notes, setNotes] = useState(meeting.notes || "");
    const [debouncedNotes] = useDebounce(notes, 1000); // Auto-save notes

    // Text Size: 'text-sm', 'text-base', 'text-lg'
    const [textSize, setTextSize] = useState("text-base");
    const [transcriptSearch, setTranscriptSearch] = useState("");

    // Speaker Renaming
    const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);
    const [speakers, setSpeakers] = useState<string[]>([]);
    const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({});

    const currentMeeting = translatedData || { ...meeting, title }; // Use local title

    // Auto-save Notes
    useEffect(() => {
        if (debouncedNotes !== meeting.notes) {
            updateMeetingNotes(meeting.id, debouncedNotes);
        }
    }, [debouncedNotes, meeting.id, meeting.notes]);

    const handleTitleSave = async () => {
        if (title !== meeting.title) {
            const res = await updateMeetingTitle(meeting.id, title);
            if (!res.success) toast.error("Failed to update title");
            else toast.success("Title updated");
        }
        setIsEditingTitle(false);
    }

    // Extract unique speakers when modal opens
    useEffect(() => {
        if (isSpeakerModalOpen && currentMeeting.transcript) {
            const regex = /Speaker \d+:/g;
            const found = currentMeeting.transcript.match(regex) || [];
            // distinct
            const unique = Array.from(new Set(found)).map((s) => (s as string).replace(':', ''));
            setSpeakers(unique);
            // Initialize map
            const initialMap: Record<string, string> = {};
            unique.forEach((s: string) => initialMap[s] = s);
            setSpeakerMap(initialMap);
        }
    }, [isSpeakerModalOpen, currentMeeting.transcript]);

    const handleSpeakerSave = async () => {
        let transcript = currentMeeting.transcript;
        for (const [oldName, newName] of Object.entries(speakerMap)) {
            if (oldName !== newName) {
                const res = await renameSpeakerInTranscript(meeting.id, transcript, oldName, newName);
                if (res.success && res.newTranscript) transcript = res.newTranscript;
            }
        }
        setIsSpeakerModalOpen(false);
        toast.success("Speakers updated");
        // Force refresh or update local state logic would be needed here deeply, 
        // but revalidatePath in server action handles the page reload usually, 
        // OR we should update local translatedData/meeting prop if we want instant feedback without reload.
        // For now, reliance on revalidatePath.
    }

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

    // Simulate progress for the overlay since we don't have real-time socket updates yet
    const [simulatedProgress, setSimulatedProgress] = useState(10);

    useEffect(() => {
        if (!meeting.transcript && !meeting.summary) {
            const interval = setInterval(() => {
                setSimulatedProgress(prev => {
                    if (prev >= 95) return 95;
                    return prev + Math.random() * 5; // meaningful increments
                });
            }, 800);
            return () => clearInterval(interval);
        }
    }, [meeting.transcript, meeting.summary]);

    // Show Overlay if processing (and NOT failed)
    if (meeting.status !== 'failed' && !meeting.transcript && !meeting.summary) {
        return <PremiumProcessingOverlay status="Analyzing Audio..." progress={simulatedProgress} />
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
                    <Dialog open={isSpeakerModalOpen} onOpenChange={setIsSpeakerModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start h-9 text-sm font-normal text-muted-foreground hover:text-foreground">
                                <Users className="mr-2 h-4 w-4" /> Manage Speakers
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Manage Speakers</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                {speakers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No speakers found in transcript.</p>
                                ) : (
                                    speakers.map((speaker, idx) => (
                                        <div key={idx} className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">{speaker}</Label>
                                            <div className="col-span-3">
                                                <Input
                                                    value={speakerMap[speaker] || speaker}
                                                    onChange={(e) => setSpeakerMap(prev => ({ ...prev, [speaker]: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSpeakerSave}>Save Changes</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

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

                        {translatedData ? (
                            <Button
                                size="sm"
                                className="ml-2 h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white border-0"
                                onClick={async () => {
                                    const { saveTranslatedMeeting } = await import('@/app/actions');
                                    const toastId = toast.loading("Saving translation...");
                                    const res = await saveTranslatedMeeting(meeting.id, translatedData);
                                    if (res.success) {
                                        toast.success("Translation saved permanently!", { id: toastId });
                                        router.refresh();
                                        setTranslatedData(null); // Reset since it's now the 'current'
                                        setLanguage("English"); // Reset selector visually or keep as is? User might want to know it's Spanish now.
                                        // Actually, if we overwrite, the 'original' is now Spanish.
                                    } else {
                                        toast.error("Failed to save", { id: toastId });
                                    }
                                }}
                            >
                                Save Translation
                            </Button>
                        ) : (
                            <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 bg-indigo-500/10 ml-2">
                                Processed
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Document Canvas */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:px-16 max-w-5xl mx-auto w-full">
                    {/* Stuck Processing / Error Handling */}
                    {(meeting.status === 'failed' || (!meeting.transcript && meeting.status === 'completed')) && (
                        <div className="mb-8 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                <span className="font-bold">!</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Processing Issue</h3>
                                <p className="text-xs opacity-90">
                                    {meeting.status === 'failed' ? "Processing failed. Please try re-uploading." : "Transcription missing. The audio may be corrupt or too short."}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                                    onClick={async () => {
                                        const { retryProcessing } = await import("@/app/actions");
                                        const toastId = toast.loading("Retrying...");
                                        const res = await retryProcessing(meeting.id);
                                        if (res.success) {
                                            toast.success("Retry started", { id: toastId });
                                            router.refresh();
                                        } else {
                                            toast.error("Retry failed", { id: toastId });
                                        }
                                    }}
                                >
                                    Retry Processing
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header */}
                        <div className="flex flex-col gap-4">
                            {isEditingTitle ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="text-xl font-bold h-10"
                                        onBlur={handleTitleSave}
                                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                                        autoFocus
                                    />
                                    <Button size="sm" onClick={handleTitleSave}>Save</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}>Cancel</Button>
                                </div>
                            ) : (
                                <h1
                                    onClick={() => setIsEditingTitle(true)}
                                    className="text-xl font-bold text-foreground mb-2 leading-tight hover:bg-accent/50 p-1 -ml-1 rounded cursor-pointer transition-colors border border-transparent hover:border-border"
                                    title="Click to edit title"
                                >
                                    {title}
                                </h1>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5" suppressHydrationWarning>
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(currentMeeting.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1.5" suppressHydrationWarning>
                                        <Clock className="h-3.5 w-3.5" />
                                        {new Date(currentMeeting.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Search Input for Transcript */}
                                    <div className="relative w-48 md:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Find in transcript..."
                                            className="pl-8 h-8 text-xs bg-muted/30 border-border"
                                            value={transcriptSearch}
                                            onChange={(e) => setTranscriptSearch(e.target.value)}
                                        />
                                    </div>

                                    {/* Text Size Controls */}
                                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
                                        <Button
                                            variant={textSize === 'text-sm' ? 'secondary' : 'ghost'}
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setTextSize('text-sm')}
                                            title="Small Text"
                                        >
                                            <span className="text-xs">A</span>
                                        </Button>
                                        <Button
                                            variant={textSize === 'text-base' ? 'secondary' : 'ghost'}
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setTextSize('text-base')}
                                            title="Medium Text"
                                        >
                                            <span className="text-sm">A</span>
                                        </Button>
                                        <Button
                                            variant={textSize === 'text-lg' ? 'secondary' : 'ghost'}
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setTextSize('text-lg')}
                                            title="Large Text"
                                        >
                                            <span className="text-lg">A</span>
                                        </Button>
                                    </div>
                                </div>
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
                                    <p className={`text-foreground leading-relaxed font-light transition-all duration-300 ${textSize === 'text-sm' ? 'text-sm' : textSize === 'text-base' ? 'text-base' : 'text-lg'}`}>
                                        {currentMeeting.summary}
                                    </p>
                                </div>
                            </div>
                        )}


                        {/* Transcript Section - NOW INTERACTIVE */}
                        <div className={textSize}>
                            <TranscriptView originalTranscript={currentMeeting.transcript || ''} searchTerm={transcriptSearch} />
                        </div>

                    </div>
                </div>
            </div>

            {/* Chat Bar */}
            <AiChatBar context={`Meeting Title: ${currentMeeting.title}\n\nSummary:\n${currentMeeting.summary}\n\nTranscript:\n${currentMeeting.transcript}`} />

            {/* RIGHT COLUMN: Action Items & Notes Sidebar */}
            <div className="hidden lg:flex w-[350px] border-l border-border/40 bg-card/30 flex-col shrink-0">
                <Tabs defaultValue="actions" className="flex flex-col h-full">
                    <div className="p-4 border-b border-border/40 flex items-center justify-between">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="actions">Action Items</TabsTrigger>
                            <TabsTrigger value="notes">Notes</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="actions" className="flex-1 overflow-y-auto p-4 space-y-3 m-0 data-[state=inactive]:hidden">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-sm tracking-tight text-muted-foreground">Detected Items</h2>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-0 font-medium text-xs">
                                {currentMeeting.action_items?.length || 0} Open
                            </Badge>
                        </div>

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
                    </TabsContent>

                    <TabsContent value="notes" className="flex-1 flex flex-col p-4 m-0 data-[state=inactive]:hidden h-full">
                        <div className="flex flex-col h-full gap-2">
                            <Label htmlFor="meeting-notes" className="sr-only">Meeting Notes</Label>
                            <Textarea
                                id="meeting-notes"
                                placeholder="Type your personal notes here..."
                                className="flex-1 resize-none bg-card/50 border-white/10 focus-visible:ring-indigo-500/50 p-4 leading-relaxed"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground text-right">
                                {debouncedNotes === meeting.notes ? "Saved" : "Saving..."}
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

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
