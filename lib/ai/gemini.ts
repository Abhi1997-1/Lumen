import { AIService } from './service';
import { processMeetingWithGemini, analyzeMeetingText } from '@/lib/gemini/service';
import { createClient } from '@/lib/supabase/server';

export class GeminiService implements AIService {
    constructor(private userId: string) { }

    async transcribe(filePath: string): Promise<string> {
        throw new Error("Transcribe not supported on Gemini service. Please use Groq for transcription.");
    }

    async analyze(transcript: string, meetingId: string): Promise<void> {
        try {
            const result = await analyzeMeetingText(this.userId, transcript);

            // Calculate estimated duration
            const wordCount = transcript.trim().split(/\s+/).length;
            const estimatedDuration = Math.ceil(wordCount / 2.5);

            // Save to DB
            const supabase = await createClient();
            await supabase
                .from('meetings')
                .update({
                    transcript: transcript, // Save the transcript
                    summary: result.summary,
                    action_items: result.action_items,
                    input_tokens: result.usage?.input_tokens || 0,
                    output_tokens: result.usage?.output_tokens || 0,
                    total_tokens: result.usage?.total_tokens || 0,
                    status: 'completed',
                    // participants: result.participants || [], // Text analysis doesn't give participants unless we prompt for it
                    // For now, omit participants or leave empty
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
