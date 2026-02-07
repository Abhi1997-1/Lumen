import { AIService } from './service';
import { processMeetingWithGemini } from '@/lib/gemini/service';
import { createClient } from '@/lib/supabase/server';

export class GeminiService implements AIService {
    constructor(private userId: string) { }

    async process(filePath: string, meetingId: string): Promise<void> {
        try {
            // Re-use existing business logic
            // Note: processMeetingWithGemini is "multimodal", inputs audio, outputs full metadata
            const result = await processMeetingWithGemini(this.userId, filePath);

            // Calculate estimated duration if not provided
            const wordCount = result.transcript ? result.transcript.trim().split(/\s+/).length : 0;
            const estimatedDuration = Math.ceil(wordCount / 2.5);

            // Save to DB
            const supabase = await createClient();
            await supabase
                .from('meetings')
                .update({
                    transcript: result.transcript,
                    summary: result.summary,
                    action_items: result.action_items,
                    input_tokens: result.usage?.input_tokens || 0,
                    output_tokens: result.usage?.output_tokens || 0,
                    total_tokens: result.usage?.total_tokens || 0,
                    status: 'completed',
                    participants: result.participants || [],
                    // Only update duration if it wasn't set (or we want to overwrite?)
                    // The main action usually sets duration. 
                    // Let's safe-guard: if result has duration? No, result doesn't.
                    // We'll update duration here just in case.
                })
                .eq('id', meetingId);

        } catch (error) {
            console.error("Gemini Service Error:", error);
            const supabase = await createClient();
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            await supabase.from('meetings').update({
                status: 'failed',
                summary: `Processing Error: ${errorMessage}`
            }).eq('id', meetingId)
            throw error;
        }
    }
    async ask(context: string, question: string): Promise<string> {
        const { generateAnswer } = await import('@/lib/gemini/service');
        return await generateAnswer(this.userId, context, question);
    }
}
