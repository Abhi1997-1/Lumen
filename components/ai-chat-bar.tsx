"use strict";
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, Bot } from "lucide-react";
import { askGemini } from "@/app/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AiChatBarProps {
    context: string;
}

export function AiChatBar({ context }: AiChatBarProps) {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);

    const handleAsk = async (e?: React.FormEvent, queryOverride?: string) => {
        e?.preventDefault();
        const userQuery = queryOverride || query;

        if (!userQuery.trim() || isLoading) return;

        if (!queryOverride) {
            setQuery("");
        }

        setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
        setIsLoading(true);

        try {
            const result = await askGemini(context, userQuery);
            if (result.success && result.answer) {
                setMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);
            } else {
                toast.error(result.error || "Failed to get answer");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-50 transition-all duration-300 flex flex-col items-end gap-4",
            isOpen ? "w-[380px]" : "w-auto"
        )}>
            {/* Chat Window */}
            {isOpen && (
                <div className="w-full bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Meeting Assistant</h3>
                                <p className="text-[10px] text-muted-foreground">Ask about this transcript</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="sr-only">Close</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="h-[300px] overflow-y-auto p-4 space-y-4 bg-background/50">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                                <Sparkles className="h-8 w-8 opacity-20" />
                                <p className="text-sm">Ask me anything about the meeting.</p>
                                <div className="flex flex-wrap justify-center gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs border-border bg-muted/50 hover:bg-muted h-7"
                                        onClick={() => handleAsk(undefined, "What are the key takeaways?")}
                                    >
                                        Key Takeaways
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs border-border bg-muted/50 hover:bg-muted h-7"
                                        onClick={() => handleAsk(undefined, "List action items")}
                                    >
                                        Action Items
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                                    <div className={cn(
                                        "max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted text-foreground border border-border rounded-tl-sm"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="bg-muted border border-border rounded-2xl rounded-tl-sm p-3 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-card border-t border-border">
                        <form onSubmit={handleAsk} className="relative">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask a question..."
                                className="pr-10 bg-background border-border focus-visible:ring-primary/50"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isLoading || !query.trim()}
                                className="absolute right-1 top-1 h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                <Send className="h-3 w-3" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Float Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 pl-4 pr-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 flex items-center gap-3 transition-transform hover:scale-105"
                >
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Ask AI</span>
                </Button>
            )}
        </div>
    );
}
