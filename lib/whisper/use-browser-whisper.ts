'use client';

import { useState, useCallback, useRef } from 'react';

// Types
interface TranscriptionProgress {
    status: 'idle' | 'loading-model' | 'transcribing' | 'complete' | 'error';
    progress: number; // 0-100
    message: string;
}

interface UseBrowserWhisperReturn {
    transcribe: (audioBlob: Blob) => Promise<string>;
    progress: TranscriptionProgress;
    isReady: boolean;
    error: string | null;
}

// Singleton for the pipeline (models are cached)
let pipelineInstance: any = null;
let pipelineLoading = false;

export function useBrowserWhisper(): UseBrowserWhisperReturn {
    const [progress, setProgress] = useState<TranscriptionProgress>({
        status: 'idle',
        progress: 0,
        message: ''
    });
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPipeline = useCallback(async () => {
        if (pipelineInstance) {
            setIsReady(true);
            return pipelineInstance;
        }

        if (pipelineLoading) {
            // Wait for existing load
            while (pipelineLoading) {
                await new Promise(r => setTimeout(r, 100));
            }
            return pipelineInstance;
        }

        pipelineLoading = true;
        setProgress({ status: 'loading-model', progress: 0, message: 'Loading Whisper model (~50MB)...' });

        try {
            // Dynamic import to avoid SSR issues
            const { pipeline } = await import('@xenova/transformers');

            pipelineInstance = await pipeline(
                'automatic-speech-recognition',
                'Xenova/whisper-small', // ~50MB, good balance of speed/accuracy
                {
                    progress_callback: (data: any) => {
                        if (data.status === 'progress') {
                            const pct = Math.round((data.loaded / data.total) * 100);
                            setProgress({
                                status: 'loading-model',
                                progress: pct,
                                message: `Downloading model: ${pct}%`
                            });
                        }
                    }
                }
            );

            setIsReady(true);
            setProgress({ status: 'idle', progress: 100, message: 'Model ready' });
            pipelineLoading = false;
            return pipelineInstance;
        } catch (err: any) {
            pipelineLoading = false;
            setError(err.message);
            setProgress({ status: 'error', progress: 0, message: err.message });
            throw err;
        }
    }, []);

    const transcribe = useCallback(async (audioBlob: Blob): Promise<string> => {
        setError(null);

        try {
            // 1. Load model if needed
            const transcriber = await loadPipeline();

            // 2. Convert blob to audio data
            setProgress({ status: 'transcribing', progress: 10, message: 'Processing audio...' });

            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioContext = new AudioContext({ sampleRate: 16000 });
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Get mono channel
            const audioData = audioBuffer.getChannelData(0);

            setProgress({ status: 'transcribing', progress: 30, message: 'Transcribing...' });

            // 3. Transcribe
            const result = await transcriber(audioData, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'english',
                task: 'transcribe',
                return_timestamps: false,
            });

            setProgress({ status: 'complete', progress: 100, message: 'Done!' });

            return result.text || '';
        } catch (err: any) {
            console.error('Browser transcription error:', err);
            setError(err.message);
            setProgress({ status: 'error', progress: 0, message: err.message });
            throw err;
        }
    }, [loadPipeline]);

    return {
        transcribe,
        progress,
        isReady,
        error
    };
}
