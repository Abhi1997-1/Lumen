import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { decryptText } from "@/lib/encryption";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, trackAPIUsage } from "@/lib/rate-limit/middleware";
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function processMeetingWithGemini(
    userId: string,
    storagePath: string,
    modelName: string = 'gemini-2.0-flash-exp'  // Using stable experimental model
) {
    console.log("🚀 START: processMeetingWithGemini", { userId, storagePath });
    try {
        // 0. CHECK RATE LIMIT FIRST
        console.log("0. Checking rate limits...");
        const rateLimitCheck = await checkRateLimit(userId, 'gemini');

        if (!rateLimitCheck.allowed) {
            console.error("❌ Rate limit exceeded", rateLimitCheck);
            await trackAPIUsage(userId, 'gemini', {
                endpoint: 'processMeeting',
                success: false,
                errorCode: 'RATE_LIMIT_EXCEEDED',
                errorMessage: rateLimitCheck.errorMessage
            });

            return {
                success: false,
                error: rateLimitCheck.errorMessage,
                upgradePrompt: rateLimitCheck.upgradePrompt,
                resetAt: rateLimitCheck.resetAt.toISOString()
            };
        }
        console.log("✅ Rate limit OK, remaining:", rateLimitCheck.remaining);

        // 1. Get User Key
        console.log("1. Initializing Admin Client...");
        const supabase = await createAdminClient();

        console.log("1a. Fetching User Settings...");
        const { data: settings, error: settingsError } = await supabase.from('user_settings').select('gemini_api_key').eq('user_id', userId).single();

        if (settingsError) {
            console.error("❌ Error fetching settings:", settingsError);
            throw new Error(`Failed to fetch settings: ${settingsError.message}`);
        }

        let apiKey = '';
        if (settings?.gemini_api_key) {
            console.log("1b. Found Custom API Key, decrypting...");
            apiKey = decryptText(settings.gemini_api_key);
        } else if (process.env.GEMINI_API_KEY) {
            console.log("1b. Using System API Key...");
            apiKey = process.env.GEMINI_API_KEY;
        } else {
            console.error("❌ No API Key found!");
            throw new Error("Gemini API Key not found. Please add it in Settings.");
        }

        // 2. Download File from Supabase to Temp
        console.log("2. Downloading file from Storage...");
        const { data: fileData, error: downloadError } = await supabase.storage.from('meetings').download(storagePath);
        if (downloadError) {
            console.error("❌ Download Error:", downloadError);
            throw downloadError;
        }

        console.log("2a. File downloaded, size:", fileData.size);
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}.mp3`);
        fs.writeFileSync(tempFilePath, buffer);
        console.log("2b. Saved to temp path:", tempFilePath);

        try {
            // 3. Upload to Gemini
            console.log("3. Uploading to Gemini FileManager...");
            const fileManager = new GoogleAIFileManager(apiKey);
            const uploadResponse = await fileManager.uploadFile(tempFilePath, {
                mimeType: fileData.type || "audio/mp3",
                displayName: "Meeting Audio",
            });
            console.log("3a. Upload response:", uploadResponse.file.name);

            // 3.5 Wait for file to be active
            console.log("3b. Waiting for processing...");
            let file = await fileManager.getFile(uploadResponse.file.name);
            while (file.state === "PROCESSING") {
                console.log("... still processing ...");
                await new Promise((resolve) => setTimeout(resolve, 2000));
                file = await fileManager.getFile(uploadResponse.file.name);
            }

            if (file.state === "FAILED") {
                console.error("❌ Gemini File Processing FAILED");
                throw new Error("Video processing failed.");
            }
            console.log("3c. File Ready!", file.state);

            // 4. Generate Content
            console.log("4. Generating Content with Gemini...");
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            transcript: { type: SchemaType.STRING },
                            summary: { type: SchemaType.STRING },
                            action_items: {
                                type: SchemaType.ARRAY,
                                items: { type: SchemaType.STRING }
                            }
                        }
                    }
                }
            });

            const prompt = "Analyze this audio transcript. 1) Provide a verbatim transcript properly formatted with 'Speaker X:' labels. 2) Provide a comprehensive 'Executive Summary' capturing the key discussion points and decisions. 3) List all 'action_items' clearly. IMPORTANT: Ensure the Output matches the JSON schema exactly. If silence/no speech, return empty fields.";

            const result = await model.generateContent([
                {
                    fileData: {
                        mimeType: uploadResponse.file.mimeType,
                        fileUri: uploadResponse.file.uri
                    }
                },
                { text: prompt }
            ]);

            console.log("5. Content Generated! Parsing response...");
            const responseText = result.response.text();
            const usage = result.response.usageMetadata;

            const parsedResponse = JSON.parse(responseText);

            // Track successful API usage
            console.log("5a. Tracking API usage...");
            await trackAPIUsage(userId, 'gemini', {
                endpoint: 'processMeeting',
                tokensUsed: usage?.totalTokenCount || 0,
                success: true
            });

            return {
                ...parsedResponse,
                usage: {
                    input_tokens: usage?.promptTokenCount || 0,
                    output_tokens: usage?.candidatesTokenCount || 0,
                    total_tokens: usage?.totalTokenCount || 0
                }
            };

        } finally {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
                console.log("Cleanup: Temp file removed");
            }
        }
    } catch (e) {
        console.error("❌ FATAL ERROR in processMeetingWithGemini:", e);
        throw e;
    }
}

// Helper to get authorized model
async function getGeminiModel(userId: string) {
    const supabase = await createAdminClient();
    const { data: settings } = await supabase.from('user_settings').select('gemini_api_key').eq('user_id', userId).single();

    let apiKey = '';
    if (settings?.gemini_api_key) {
        apiKey = decryptText(settings.gemini_api_key);
    } else if (process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY;
    } else {
        throw new Error("Gemini API Key not found.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
}

export async function generateTranslation(userId: string, text: string, targetLanguage: string) {
    try {
        const model = await getGeminiModel(userId);
        const prompt = `Translate the following transcript text into ${targetLanguage}. Maintain the speaker labels (e.g., 'Speaker 1:') if present, but translate the dialogue. Return ONLY the translated text.

Text to translate:
${text}`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Translation error:", error);
        throw new Error("Failed to translate transcript.");
    }
}

export async function generateAnswer(userId: string, context: string, question: string) {
    try {
        const model = await getGeminiModel(userId);
        const prompt = `You are a helpful AI assistant analyzing a meeting transcript.
        
Context (Transcript/Summary):
${context.substring(0, 10000)} // Limit context window

User Question: ${question}

Answer concisely and accurately based ONLY on the provided context. If the answer is not in the context, say so.`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Chat error:", error);
        throw new Error("Failed to generate answer.");
    }
}

export async function generateMeetingTranslation(userId: string, meetingSummary: string, meetingActionItems: string[], meetingTranscript: string, targetLanguage: string) {
    try {
        const model = await getGeminiModel(userId);

        const prompt = `Translate the following meeting content into ${targetLanguage}.
        
        Input Data:
        SUMMARY:
        ${meetingSummary}

        ACTION ITEMS (JSON Array):
        ${JSON.stringify(meetingActionItems)}

        TRANSCRIPT:
        ${meetingTranscript.substring(0, 30000)}

        Instructions:
        1. return a JSON object with keys: "summary" (string), "action_items" (array of strings), "transcript" (string).
        2. Translate the summary text.
        3. Translate each item in the action_items array.
        4. Translate the transcript text. Kkeep speaker labels (e.g. "Speaker 1:") in original language, translate only the speech.
        5. Return ONLY the raw JSON string. Do not use markdown like \`\`\`json.`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        // Clean up markdown if present
        if (responseText.startsWith('```json')) {
            responseText = responseText.replace(/^```json/, '').replace(/```$/, '');
        } else if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```/, '').replace(/```$/, '');
        }

        return JSON.parse(responseText.trim());
    } catch (error) {
        console.error("Meeting translation error:", error);
        throw new Error("Failed to translate meeting content.");
    }
}

export async function processFolderChat(userId: string, folderId: string, question: string) {
    try {
        const supabase = await createAdminClient();

        // 1. Fetch all meetings in the folder
        const { data: meetings, error } = await supabase
            .from('meetings')
            .select('title, transcript, summary, created_at')
            .eq('folder_id', folderId)
            .eq('user_id', userId);

        if (error) throw error;
        if (!meetings || meetings.length === 0) {
            return "This folder has no meetings yet.";
        }

        // 2. Construct large context
        let fullContext = `You are a helpful assistant analyzing a GROUP of meeting transcripts.\n\n`;

        meetings.forEach((m, i) => {
            const date = new Date(m.created_at).toLocaleDateString();
            fullContext += `--- MEETING ${i + 1}: ${m.title || 'Untitled'} (${date}) ---\n`;
            fullContext += `SUMMARY: ${m.summary || 'N/A'}\n`;
            fullContext += `TRANSCRIPT START:\n${m.transcript ? m.transcript.substring(0, 25000) : 'No transcript'}\nTRANSCRIPT END\n\n`;
        });

        fullContext += `\nUSER QUESTION: ${question}\n\n`;
        fullContext += `INSTRUCTIONS: Answer the question based on the synthesized knowledge from ALL the meetings above. Cite specific meetings (e.g., "In the Marketing Sync...") if relevant.`;

        // 3. Send to Gemini
        const model = await getGeminiModel(userId);
        const result = await model.generateContent(fullContext);
        return result.response.text();

    } catch (error) {
        console.error("Folder chat error:", error);
        throw new Error("Failed to generate answer for folder.");
    }
}

export async function transcribeAudioChunkGemini(userId: string, audioBuffer: Buffer, mimeType: string, targetLanguage?: string) {
    try {
        const model = await getGeminiModel(userId);

        let prompt = "Transcribe the following audio chunk accurately. Return ONLY the verbatim text.";

        if (targetLanguage && targetLanguage !== 'English') {
            prompt = `Transcribe the audio and IMMEDIATELY translate it to ${targetLanguage}. Return ONLY the ${targetLanguage} translation. Do not include the original text.`;
        }

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: audioBuffer.toString("base64")
                }
            },
            { text: prompt }
        ]);

        return result.response.text();
    } catch (error) {
        console.error("Chunk transcription error:", error);
        return "";
    }
}

export async function analyzeMeetingText(userId: string, transcript: string, modelName: string = 'gemini-2.0-flash-exp') {
    try {
        console.log("AnalyzeText: Starting text analysis...");
        // 1. Get Key
        const supabase = await createAdminClient();
        const { data: settings } = await supabase.from('user_settings').select('gemini_api_key').eq('user_id', userId).single();

        let apiKey = '';
        if (settings?.gemini_api_key) {
            apiKey = decryptText(settings.gemini_api_key);
        } else if (process.env.GEMINI_API_KEY) {
            apiKey = process.env.GEMINI_API_KEY;
        } else {
            throw new Error("Gemini API Key not found.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING },
                        summary: { type: SchemaType.STRING },
                        action_items: {
                            type: SchemaType.ARRAY,
                            items: { type: SchemaType.STRING }
                        }
                    }
                }
            }
        });

        const prompt = `Analyze this transcript. 
        1) Provide a concise Meeting Title. 
        2) Provide a comprehensive 'Executive Summary'. 
        3) List 'action_items'.
        
        TRANSCRIPT:
        ${transcript.substring(0, 50000)} 
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const usage = result.response.usageMetadata;

        const parsed = JSON.parse(responseText);

        await trackAPIUsage(userId, 'gemini', {
            endpoint: 'analyzeText',
            tokensUsed: usage?.totalTokenCount || 0,
            success: true
        });

        return {
            ...parsed,
            usage: {
                input_tokens: usage?.promptTokenCount || 0,
                output_tokens: usage?.candidatesTokenCount || 0,
                total_tokens: usage?.totalTokenCount || 0
            }
        };

    } catch (error) {
        console.error("Gemini Text Analysis Error:", error);
        throw error;
    }
}
