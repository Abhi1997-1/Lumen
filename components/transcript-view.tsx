"use strict";
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useEffect, useRef } from "react";

interface TranscriptViewProps {
    originalTranscript: string;
    searchTerm?: string;
    currentMatchIndex?: number;
    onMatchesFound?: (count: number) => void;
}

export function TranscriptView({ originalTranscript, searchTerm = "", currentMatchIndex, onMatchesFound }: TranscriptViewProps) {
    // Determine if we have content
    const hasContent = originalTranscript && originalTranscript.trim().length > 0;

    function formatTime(seconds: number) {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    // Helper to highlight text and track matches
    // We need a stable way to count matches. 
    // Ideally, we'd process the whole transcript once to find indices, but doing it render-time with unique IDs is easier for React.
    // We'll use a global counter ref for the current render cycle? No, that's unsafe.
    // We'll rely on the parent to manage the "current" index, and we just render all matches with a predictable class/ID.
    // Actually, to know "which" match is "active", we need to know the total count and order.
    // We can use `document.querySelectorAll` in an effect to manage scrolling.

    // Let's use a class `transcript-highlight-match` and `transcript-highlight-match-active`.

    useEffect(() => {
        if (!searchTerm) return;

        // Find all matches in DOM
        const matches = document.querySelectorAll('.transcript-highlight-match');
        onMatchesFound?.(matches.length);

        if (currentMatchIndex !== undefined && matches[currentMatchIndex]) {
            matches[currentMatchIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [searchTerm, originalTranscript, currentMatchIndex, onMatchesFound]);

    let matchCount = 0; // Reset on render

    const highlightText = (text: string) => {
        if (!searchTerm) return text;
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));

        return (
            <span>
                {parts.map((part, i) => {
                    const isMatch = part.toLowerCase() === searchTerm.toLowerCase();
                    if (isMatch) {
                        const isCurrent = matchCount === currentMatchIndex;
                        const element = (
                            <span
                                key={i}
                                className={`transcript-highlight-match ${isCurrent ? 'bg-orange-400 text-white ring-orange-400' : 'bg-yellow-200 dark:bg-yellow-900/80 text-foreground'} font-bold px-0.5 rounded shadow-sm ring-1 ring-yellow-500/50 transition-colors duration-300`}
                            >
                                {part}
                            </span>
                        );
                        matchCount++;
                        return element;
                    }
                    return part;
                })}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                        Transcript Analysis
                    </span>
                </h3>
            </div>

            <div className="space-y-8 relative">
                {/* Vertical timeline line */}
                <div className="absolute left-4 top-4 bottom-4 w-[2px] bg-border/50" />

                {hasContent ? (
                    originalTranscript
                        .replace(/(Speaker \d+:)/g, '\n$1')
                        .split('\n')
                        .map((line: string, i: number) => {

                            const colonIndex = line.indexOf(':');
                            const speaker = colonIndex > -1 && colonIndex < 20 ? line.substring(0, colonIndex) : null;
                            const text = speaker ? line.substring(colonIndex + 1).trim() : line.trim();

                            if (!line.trim()) return null;

                            // Filter if search term is present (optional, but highlighting is often better)
                            // Let's just highlight for now, unless user explicitly wanted filtering.
                            // The user said "search on the transcript page", highlighting is standard matching behavior.

                            const speakerColor = speaker ? (speaker.length % 2 === 0 ? 'text-indigo-500 underline decoration-indigo-500/30' : 'text-emerald-500 underline decoration-emerald-500/30') : 'text-muted-foreground';
                            const avatarBg = speaker ? (speaker.length % 2 === 0 ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500') : 'bg-muted';

                            return (
                                <div key={i} className="flex gap-6 group relative">
                                    <div className="shrink-0 z-10">
                                        <Avatar className={`h-9 w-9 border-2 border-background ${avatarBg} shadow-sm`}>
                                            <AvatarFallback className={`text-[10px] font-bold bg-transparent`}>
                                                {speaker ? speaker.substring(0, 2).toUpperCase() : 'SP'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="space-y-1.5 flex-1 bg-muted/30 hover:bg-muted/50 p-4 rounded-xl border border-transparent hover:border-border transition-all">
                                        {speaker && (
                                            <p className={`text-xs font-bold uppercase tracking-wider ${speakerColor} flex items-center gap-2`}>
                                                {speaker}
                                                <span className="text-[10px] text-muted-foreground font-normal normal-case no-underline">• {formatTime(i * 30)}</span>
                                            </p>
                                        )}
                                        {/* REMOVED hardcoded text-[15px] to allow inheritance */}
                                        <p className="text-foreground leading-relaxed transition-colors font-light">
                                            {highlightText(text)}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                ) : (
                    <p className="text-muted-foreground italic pl-12">No transcript available.</p>
                )}
            </div>
        </div>
    );
}
