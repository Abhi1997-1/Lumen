"use strict";
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface TranscriptViewProps {
    originalTranscript: string;
}

export function TranscriptView({ originalTranscript }: TranscriptViewProps) {
    // Determine if we have content
    const hasContent = originalTranscript && originalTranscript.trim().length > 0;

    function formatTime(seconds: number) {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

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
                    // Regex to match "Speaker X:" or just newlines. 
                    // We split by newline first, then if a line has multiple speakers, we split again?
                    // Simpler: Replace "Speaker" with "\nSpeaker" to force newlines? 
                    // Robust: Match /(?=Speaker \d+:)/g or similar known patterns
                    originalTranscript
                        .replace(/(Speaker \d+:)/g, '\n$1') // Ensure newlines before speakers
                        .split('\n')
                        .map((line: string, i: number) => {

                            const colonIndex = line.indexOf(':');
                            const speaker = colonIndex > -1 && colonIndex < 20 ? line.substring(0, colonIndex) : null;

                            // Clean up text
                            const text = speaker ? line.substring(colonIndex + 1).trim() : line.trim();

                            // Skip empty lines
                            if (!line.trim()) return null;

                            // Determine Color based on speaker (simple hash for consistent colors)
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
                                                <span className="text-[10px] text-muted-foreground font-normal normal-case no-underline">• {formatTime(i * 30)}</span> {/* Mock timestamp */}
                                            </p>
                                        )}
                                        <p className="text-foreground leading-relaxed text-[15px] transition-colors font-light">
                                            {text}
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
