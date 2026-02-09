import OpenAI from 'openai';
import { AIService } from './service';
import fs from 'fs';
import { createClient } from '@/lib/supabase/server';

export class OpenAIService implements AIService {
    private openai: OpenAI;

    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }



    async ask(context: string, question: string): Promise<string> {
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful AI assistant. Answer the question based on the provided context.
                        Context: ${context}`
                    },
                    { role: 'user', content: question }
                ],
                model: 'gpt-4o',
            });
            return completion.choices[0]?.message?.content || "No answer generated.";
        } catch (error) {
            console.error("OpenAI Ask Error:", error);
            throw error;
        }
    }

    async transcribe(filePath: string): Promise<string> {
        throw new Error("Transcribe not supported on OpenAI service. Please use Groq for transcription.");
    }

    async analyze(transcript: string, meetingId: string, model?: string): Promise<void> {
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert meeting assistant. Analyze the transcript and provide a summary.
                        Return ONLY valid JSON with this structure:
                        {
                            "title": "Concise Meeting Title",
                            "summary": "3-5 sentence summary",
                            "actionItems": ["Action item 1", "Action item 2"]
                        }`
                    },
                    { role: 'user', content: transcript }
                ],
                model: 'gpt-4o',
                response_format: { type: 'json_object' }
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) throw new Error("No summary generated");

            const result = JSON.parse(content);

            // Save to DB
            const supabase = await createClient();
            await supabase
                .from('meetings')
                .update({
                    title: result.title,
                    summary: result.summary,
                    action_items: result.actionItems,
                    status: 'completed'
                })
                .eq('id', meetingId);

        } catch (error) {
            console.error("OpenAI Summary Error:", error);
            throw error;
        }
    }
}
