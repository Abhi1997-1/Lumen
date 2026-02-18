/**
 * Native Whisper transcription service using whisper.rn
 * Uses the Base model (~140MB) for better accuracy
 */

import { initWhisper, WhisperContext } from 'whisper.rn';
import * as FileSystem from 'expo-file-system/legacy';

const MODEL_NAME = 'ggml-base.en.bin';
const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin';

let whisperContext: WhisperContext | null = null;

/**
 * Download the Whisper model if not already cached
 */
async function downloadModelIfNeeded(onProgress?: (msg: string) => void): Promise<string> {
    const modelDir = `${FileSystem.documentDirectory}models/`;
    const modelPath = `${modelDir}${MODEL_NAME}`;

    // Check if model exists
    const info = await FileSystem.getInfoAsync(modelPath);
    if (info.exists) {
        onProgress?.('Model loaded from cache');
        return modelPath;
    }

    // Create models directory
    await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });

    // Download model
    onProgress?.('Downloading Whisper model (~140MB)...');

    const downloadResumable = FileSystem.createDownloadResumable(
        MODEL_URL,
        modelPath,
        {},
        (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            onProgress?.(`Downloading model: ${Math.round(progress * 100)}%`);
        }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) throw new Error('Download failed');

    onProgress?.('Model downloaded successfully');
    return modelPath;
}

/**
 * Initialize the Whisper context (loads the model)
 */
async function getWhisperContext(onProgress?: (msg: string) => void): Promise<WhisperContext> {
    if (whisperContext) {
        return whisperContext;
    }

    onProgress?.('Loading Whisper model...');
    const modelPath = await downloadModelIfNeeded(onProgress);

    whisperContext = await initWhisper({
        filePath: modelPath,
    });

    onProgress?.('Whisper ready');
    return whisperContext;
}

/**
 * Transcribe an audio file
 */
export async function transcribeAudio(
    audioPath: string,
    onProgress?: (msg: string) => void
): Promise<string> {
    try {
        const ctx = await getWhisperContext(onProgress);

        onProgress?.('Transcribing...');

        const result = await ctx.transcribe(audioPath, {
            language: 'en',
            maxLen: 1,
            tokenTimestamps: false,
            onProgress: (progress) => {
                onProgress?.(`Transcribing: ${Math.round(progress)}%`);
            },
        });

        onProgress?.('Transcription complete');

        // Combine all segments into a single transcript

        // Handle case where no segments are returned (e.g., silence)
        if (!result || !result.segments) {
            console.log('No transcription segments returned (likely silence)');
            return '';
        }

        const transcript = result.segments
            .map((seg) => seg.text.trim())
            .join(' ');

        return transcript;
    } catch (error: any) {
        console.error('Transcription error:', error);
        throw error;
    }
}

/**
 * Release the Whisper context (free memory)
 */
export async function releaseWhisper(): Promise<void> {
    if (whisperContext) {
        await whisperContext.release();
        whisperContext = null;
    }
}
