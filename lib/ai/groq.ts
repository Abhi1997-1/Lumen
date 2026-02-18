import Groq from 'groq-sdk';
import fs from 'fs';
import { createAdminClient } from '@/lib/supabase/server';
import { decryptText } from '@/lib/encryption';

// ── Groq Model Registry ──────────────────────────────────────────
export interface GroqModel {
    id: string;
    name: string;
    type: 'chat' | 'whisper';
    contextWindow?: number;
    description: string;
}

export const GROQ_MODELS: GroqModel[] = [
    // Chat / LLM models
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', type: 'chat', contextWindow: 128000, description: 'Best overall quality' },
    { id: 'llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick', type: 'chat', contextWindow: 128000, description: 'Fast & capable' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 70B', type: 'chat', contextWindow: 128000, description: 'Deep reasoning' },
    { id: 'qwen-qwq-32b', name: 'Qwen QWQ 32B', type: 'chat', contextWindow: 128000, description: 'Math & reasoning' },
    // Whisper / Audio models
    { id: 'whisper-large-v3', name: 'Whisper Large v3', type: 'whisper', description: 'Best accuracy' },
    { id: 'whisper-large-v3-turbo', name: 'Whisper v3 Turbo', type: 'whisper', description: 'Faster transcription' },
];

export const DEFAULT_CHAT_MODEL = 'llama-3.3-70b-versatile';
export const DEFAULT_WHISPER_MODEL = 'whisper-large-v3-turbo';

// ── Groq Rate Limits (Free Tier) ─────────────────────────────────
export const GROQ_RATE_LIMITS = {
    whisper: {
        audioSecondsPerHour: 7200,
        requestsPerDay: 2000,
    },
    chat: {
        tokensPerMinute: 6000,
        requestsPerDay: 14400,
    },
};

// ── Service ──────────────────────────────────────────────────────
export class GroqService {
    private groq: Groq | null = null;
    private userId: string;
    private providedApiKey?: string;

    constructor(userId: string, apiKey?: string) {
        this.userId = userId;
        this.providedApiKey = apiKey;
    }

    private async initialize() {
        if (this.groq) return;

        let apiKey = this.providedApiKey;

        if (!apiKey) {
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

    // ── Ask (AI Chat) ────────────────────────────────────────────
    async ask(context: string, question: string, model?: string): Promise<string> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

        const chatModel = model || DEFAULT_CHAT_MODEL;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful AI assistant. Answer the question based on the provided context.\n                        Context: ${context}`
                    },
                    { role: 'user', content: question }
                ],
                model: chatModel,
            });
            return completion.choices[0]?.message?.content || "No answer generated.";
        } catch (error) {
            console.error("Groq Ask Error:", error);
            throw error;
        }
    }

    // ── Transcribe (Whisper) ─────────────────────────────────────
    async transcribe(storagePath: string, whisperModel?: string): Promise<string> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

        const model = whisperModel || DEFAULT_WHISPER_MODEL;

        const path = await import('path');
        const os = await import('os');
        const fs = await import('fs');

        const supabase = await createAdminClient();
        const { data: fileData, error: downloadError } = await supabase.storage.from('meetings').download(storagePath);

        if (downloadError) {
            console.error("Groq Download Error:", downloadError);
            throw new Error(`Failed to download audio file: ${downloadError.message}`);
        }

        const tempFilePath = path.join(os.tmpdir(), `groq-${Date.now()}.mp3`);
        const buffer = Buffer.from(await fileData.arrayBuffer());
        fs.writeFileSync(tempFilePath, buffer);

        try {
            const fileStream = fs.createReadStream(tempFilePath);
            const transcription = await this.groq.audio.transcriptions.create({
                file: fileStream,
                model,
                response_format: 'text',
            });
            return transcription as unknown as string;
        } catch (error) {
            console.error("Groq Transcription Error:", error);
            throw error;
        } finally {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }

    // ── Analyze (Summary + DB save with token tracking) ──────────
    async analyze(transcript: string, meetingId: string, model?: string): Promise<void> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

        const analysisModel = model || DEFAULT_CHAT_MODEL;

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
                    { role: 'user', content: transcript.substring(0, 50000) }
                ],
                model: analysisModel,
                response_format: { type: 'json_object' }
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) throw new Error("No summary generated");

            const result = JSON.parse(content);

            // Extract token usage from the Groq response
            const inputTokens = completion.usage?.prompt_tokens || 0;
            const outputTokens = completion.usage?.completion_tokens || 0;

            const supabase = await createAdminClient();
            await supabase
                .from('meetings')
                .update({
                    transcript: transcript.substring(0, 100000),
                    title: result.title,
                    summary: result.summary,
                    action_items: result.action_items,
                    key_topics: result.key_topics || [],
                    sentiment: result.sentiment || 'neutral',
                    status: 'completed',
                    model_used: analysisModel,
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                })
                .eq('id', meetingId);

        } catch (error) {
            console.error("Groq Summary Error:", error);
            const supabase = await createAdminClient();
            await supabase.from('meetings').update({
                status: 'failed',
                summary: `Processing Error: ${error instanceof Error ? error.message : "Unknown error"}`
            }).eq('id', meetingId);
            throw error;
        }
    }

    // ── Translate Text ───────────────────────────────────────────
    async translateText(text: string, targetLanguage: string, model?: string): Promise<string> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

        const chatModel = model || DEFAULT_CHAT_MODEL;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain speaker labels if present. Return ONLY the translated text.`
                    },
                    { role: 'user', content: text }
                ],
                model: chatModel,
            });
            return completion.choices[0]?.message?.content || "";
        } catch (error) {
            console.error("Groq Translation Error:", error);
            throw error;
        }
    }

    // ── Translate Meeting ────────────────────────────────────────
    async translateMeeting(summary: string, actionItems: string[], transcript: string, targetLanguage: string, model?: string): Promise<any> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

        const chatModel = model || DEFAULT_CHAT_MODEL;

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
                model: chatModel,
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

    // ── Transcribe Chunk (Live Recording) ────────────────────────
    async transcribeChunk(audioBuffer: Buffer, mimeType: string, whisperModel?: string): Promise<string> {
        await this.initialize();
        if (!this.groq) throw new Error('Groq client not initialized');

        const model = whisperModel || DEFAULT_WHISPER_MODEL;

        const path = await import('path');
        const os = await import('os');
        const fs = await import('fs');

        const tempFilePath = path.join(os.tmpdir(), `chunk-${Date.now()}.webm`);
        fs.writeFileSync(tempFilePath, audioBuffer);

        try {
            const fileStream = fs.createReadStream(tempFilePath);
            const transcription = await this.groq.audio.transcriptions.create({
                file: fileStream,
                model,
                response_format: 'text',
                language: 'en'
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
