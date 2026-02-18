// Web Worker for Whisper transcription
// This runs in an isolated thread, avoiding main thread blocking

let pipeline = null;

self.onmessage = async (event) => {
    const { type, audioData } = event.data;

    if (type === 'transcribe') {
        try {
            // Load pipeline if not already loaded
            if (!pipeline) {
                self.postMessage({ type: 'status', status: 'loading', message: 'Loading Whisper model...' });

                const { pipeline: createPipeline, env } = await import('@xenova/transformers');

                // Configure for browser
                env.allowLocalModels = false;
                env.useBrowserCache = true;

                pipeline = await createPipeline(
                    'automatic-speech-recognition',
                    'Xenova/whisper-tiny.en',
                    { quantized: true }
                );

                self.postMessage({ type: 'status', status: 'ready', message: 'Model loaded' });
            }

            self.postMessage({ type: 'status', status: 'transcribing', message: 'Transcribing...' });

            // Transcribe
            const result = await pipeline(audioData, {
                chunk_length_s: 30,
                stride_length_s: 5,
                return_timestamps: false,
            });

            self.postMessage({ type: 'result', transcript: result.text || '' });
        } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
        }
    }
};
