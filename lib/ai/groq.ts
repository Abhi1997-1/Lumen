import Groq from 'groq-sdk';
import fs from 'fs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { decryptText } from '@/lib/encryption';

export class GroqService {
    private groq: Groq | null = null;
    private userId: string;
    private providedApiKey?: string;

    constructor(userId: string, apiKey?: string) {
        this.userId = userId;
        this.providedApiKey = apiKey;
    }



    private async initialize() {
        if (this.groq) return; // Already initialized

        let apiKey = this.providedApiKey;

        if (!apiKey) {
            // Fetch from database
            const supabase = await createAdminClient();
            const { data: settings } = await supabase
                .from('user_settings')
                .select('groq_api_key')
                .eq('user_id', this.userId)
                .single();

            if (settings?.groq_api_key) {
                apiKey = await decryptText(settings.groq_api_key);
            }
        }

        if (!apiKey) {
            throw new Error('Groq API key not configured');
        }

        this.groq = new Groq({ apiKey });
    }

    async ask(context: string, question: string): Promise<string> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

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
                model: 'llama-3.3-70b-versatile',
            });
            return completion.choices[0]?.message?.content || "No answer generated.";
        } catch (error) {
            console.error("Groq Ask Error:", error);
            throw error;
        }
    }

    async transcribe(storagePath: string): Promise<string> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

        // Groq/Whisper requires a file stream. 
        // Since storagePath is a Supabase path (e.g., "userId/filename.mp3"), we must download it first.

        const path = await import('path');
        const os = await import('os');
        const fs = await import('fs');

        const supabase = await createAdminClient();
        const { data: fileData, error: downloadError } = await supabase.storage.from('meetings').download(storagePath);

        if (downloadError) {
            console.error("Groq Download Error:", downloadError);
            throw new Error(`Failed to download audio file: ${downloadError.message}`);
        }

        // Create temp file
        const tempFilePath = path.join(os.tmpdir(), `groq-${Date.now()}.mp3`);
        const buffer = Buffer.from(await fileData.arrayBuffer());
        fs.writeFileSync(tempFilePath, buffer);

        try {
            const fileStream = fs.createReadStream(tempFilePath);
            const transcription = await this.groq.audio.transcriptions.create({
                file: fileStream,
                model: 'whisper-large-v3',
                response_format: 'text',
            });
            return transcription as unknown as string;
        } catch (error) {
            console.error("Groq Transcription Error:", error);
            throw error;
        } finally {
            // Cleanup
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }

    async analyze(transcript: string, meetingId: string, model?: string): Promise<void> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

        // Use Llama 3 for analysis
        const analysisModel = model || 'llama-3.3-70b-versatile';

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
                            "action_items": ["Action item 1", "Action item 2"],
                            "key_topics": ["Topic 1", "Topic 2"],
                            "sentiment": "positive/neutral/negative"
                        }`
                    },
                    { role: 'user', content: transcript.substring(0, 50000) } // Limit context window
                ],
                model: analysisModel,
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
                    action_items: result.action_items,
                    key_topics: result.key_topics || [],
                    sentiment: result.sentiment || 'neutral',
                    status: 'completed'
                })
                .eq('id', meetingId);

        } catch (error) {
            console.error("Groq Summary Error:", error);
            const supabase = await createClient();
            await supabase.from('meetings').update({
                status: 'failed',
                summary: `Processing Error: ${error instanceof Error ? error.message : "Unknown error"}`
            }).eq('id', meetingId);
            throw error;
        }
    }

    // --- New Methods Migrated from GeminiService ---

    async translateText(text: string, targetLanguage: string): Promise<string> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain speaker labels if present. Return ONLY the translated text.`
                    },
                    { role: 'user', content: text }
                ],
                model: 'llama-3.3-70b-versatile',
            });
            return completion.choices[0]?.message?.content || "";
        } catch (error) {
            console.error("Groq Translation Error:", error);
            throw error;
        }
    }

    async translateMeeting(summary: string, actionItems: string[], transcript: string, targetLanguage: string): Promise<any> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

        try {
            const prompt = `Translate the following meeting content into ${targetLanguage}.
            
            Input Data:
            SUMMARY:
            ${summary}

            ACTION ITEMS (JSON Array):
            ${JSON.stringify(actionItems)}

            TRANSCRIPT:
            ${transcript.substring(0, 30000)}

            Instructions:
            1. return a JSON object with keys: "summary" (string), "action_items" (array of strings), "transcript" (string).
            2. Translate the summary text.
            3. Translate each item in the action_items array.
            4. Translate the transcript text. Keep speaker labels (e.g. "Speaker 1:") in original language, translate only the speech.
            5. Return ONLY the JSON object.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are a translator. Return valid JSON only.' },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.3-70b-versatile',
                response_format: { type: 'json_object' }
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) throw new Error("No translation generated");
            return JSON.parse(content);

        } catch (error) {
            console.error("Groq Meeting Translation Error:", error);
            throw error;
        }
    }

    async transcribeChunk(audioBuffer: Buffer, mimeType: string): Promise<string> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

        // Groq Whisper requies a FILE, not just a buffer. We need to write to temp.
        const path = await import('path');
        const os = await import('os');
        const fs = await import('fs');

        const tempFilePath = path.join(os.tmpdir(), `chunk-${Date.now()}.webm`); // Assuming webm from recorder
        fs.writeFileSync(tempFilePath, audioBuffer);

        try {
            const fileStream = fs.createReadStream(tempFilePath);
            const transcription = await this.groq.audio.transcriptions.create({
                file: fileStream,
                model: 'whisper-large-v3',
                response_format: 'text',
                language: 'en' // Default to English for chunks for now, or auto-detect
            });
            return transcription as unknown as string;
        } catch (error) {
            console.error("Groq Chunk Transcription Error:", error);
            return "";
        } finally {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }
}
