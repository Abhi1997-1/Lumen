import Groq from 'groq-sdk';
import { AIService } from './service';
import fs from 'fs';
import { createClient } from '@/lib/supabase/server';

export class GroqService implements AIService {
    private groq: Groq;

    constructor(apiKey: string) {
        this.groq = new Groq({ apiKey });
    }

    async process(filePath: string, meetingId: string): Promise<void> {
        const transcript = await this.transcribe(filePath);
        await this.summarize(transcript, meetingId);
    }

    async ask(context: string, question: string): Promise<string> {
        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful AI assistant. Answer the question based on the provided context.
                        Context: ${context}`
                    },
                    { role: 'user', content: question }
                ],
                model: 'llama3-70b-8192',
            });
            return completion.choices[0]?.message?.content || "No answer generated.";
        } catch (error) {
            console.error("Groq Ask Error:", error);
            throw error;
        }
    }

    private async transcribe(filePath: string): Promise<string> {
        try {
            const fileStream = fs.createReadStream(filePath);
            const transcription = await this.groq.audio.transcriptions.create({
                file: fileStream,
                model: 'whisper-large-v3',
                response_format: 'text',
            });
            return transcription as unknown as string;
        } catch (error) {
            console.error("Groq Transcription Error:", error);
            throw error;
        }
    }

    private async summarize(transcript: string, meetingId: string): Promise<void> {
        try {
            const completion = await this.groq.chat.completions.create({
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
                model: 'llama3-70b-8192',
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
            console.error("Groq Summary Error:", error);
            throw error;
        }
    }
}
