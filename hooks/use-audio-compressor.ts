
import { useState, useRef, useCallback, useEffect } from 'react'

export interface CompressionOptions {
    targetSizeMB?: number
    bitrate?: string // e.g., '64k'
    sampleRate?: string // e.g., '24000'
}

export function useAudioCompressor() {
    const [isCompressing, setIsCompressing] = useState(false)
    const [progress, setProgress] = useState(0)
    const ffmpegRef = useRef<any>(null)

    const loadFFmpeg = async () => {
        if (ffmpegRef.current) return ffmpegRef.current

        try {
            const { FFmpeg } = await import('@ffmpeg/ffmpeg')
            const { toBlobURL } = await import('@ffmpeg/util')

            const ffmpeg = new FFmpeg()
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            })

            ffmpegRef.current = ffmpeg
            return ffmpeg
        } catch (error) {
            console.error("Failed to load FFmpeg:", error)
            throw new Error("Failed to load compression engine")
        }
    }

    const compressAudio = useCallback(async (file: File, options: CompressionOptions = {}): Promise<File> => {
        setIsCompressing(true)
        setProgress(0)

        try {
            const { fetchFile } = await import('@ffmpeg/util')
            const ffmpeg = await loadFFmpeg()

            ffmpeg.on('progress', ({ progress }: { progress: number }) => {
                setProgress(Math.round(progress * 100))
            })

            const inputName = `input-${Date.now()}.${file.name.split('.').pop()}`
            const outputName = `output-${Date.now()}.mp3`

            await ffmpeg.writeFile(inputName, await fetchFile(file))

            // Optimization for Speech:
            // 1. Mono (1 channel) - Speech is mono. Stereo is wasteful.
            // 2. 22050Hz or 24000Hz - Sufficient for speech (human voice < 8kHz). 16kHz is "telephony". 44.1kHz is music.
            // 3. 48kbps - Excellent quality for mono speech. 
            const bitrate = options.bitrate || '48k'
            const sampleRate = options.sampleRate || '22050'

            // Command: -i input -ac 1 -ar 22050 -map 0:a -b:a 48k output.mp3
            await ffmpeg.exec([
                '-i', inputName,
                '-ac', '1',
                '-ar', sampleRate,
                '-map', '0:a',
                '-b:a', bitrate,
                outputName
            ])

            const data = await ffmpeg.readFile(outputName)
            const blob = new Blob([data], { type: 'audio/mp3' })
            const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name

            return new File([blob], `${originalName}-compressed.mp3`, { type: 'audio/mp3' })

        } catch (error) {
            console.error("Compression failed:", error)
            // If compression fails, we might want to throw or return original
            // But checking size is caller's job. 
            throw error
        } finally {
            setIsCompressing(false)
            setProgress(0)
            // Cleanup files in memory? FFmpeg wasm keeps them in MEMFS.
            // Ideally delete input/output
            try {
                // ffmpeg.deleteFile(inputName) // API varies, skipping for stability
            } catch (e) { }
        }
    }, [])

    return {
        compressAudio,
        isCompressing,
        progress
    }
}
