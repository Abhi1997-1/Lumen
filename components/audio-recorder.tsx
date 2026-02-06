"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Square, Trash2, Globe, Sparkles, Play, Pause } from "lucide-react"
import { transcribeChunkAction } from "@/app/actions"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface AudioRecorderProps {
    onRecordingComplete: (file: File) => void;
}

const SUPPORTED_LANGUAGES = [
    "English", "Spanish", "French", "German", "Chinese", "Japanese", "Hindi", "Portuguese"
]

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [duration, setDuration] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [liveTranscript, setLiveTranscript] = useState("")
    const [liveTranslation, setLiveTranslation] = useState("")
    const [targetLanguage, setTargetLanguage] = useState("English")

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const transcriptRef = useRef<HTMLDivElement>(null)
    const translationRef = useRef<HTMLDivElement>(null)

    // Visualizer refs
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

    useEffect(() => {
        return () => {
            cleanupAudio();
        }
    }, [])

    const cleanupAudio = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close()
            audioContextRef.current = null;
        }
    }

    // Auto-scroll
    useEffect(() => {
        if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        if (translationRef.current) translationRef.current.scrollTop = translationRef.current.scrollHeight;
    }, [liveTranscript, liveTranslation])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []
            setLiveTranscript("")
            setLiveTranslation("")

            mediaRecorder.ondataavailable = async (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)

                    const chunkBlob = new Blob([e.data], { type: 'audio/webm' });
                    const formData = new FormData();
                    formData.append('audio', chunkBlob);
                    formData.append('language', targetLanguage);

                    try {
                        const result = await transcribeChunkAction(formData);
                        if (result.success) {
                            if (result.text) setLiveTranscript(prev => prev + " " + result.text);
                            if (result.translatedText) setLiveTranslation(prev => prev + " " + result.translatedText);
                        }
                    } catch (err) {
                        console.error("Live transcribe error", err);
                    }
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setAudioBlob(blob)
                cleanupAudio(); // Stop visualizer
                stream.getTracks().forEach(track => track.stop())
            }

            // 5s slices for live transcription
            mediaRecorder.start(5000)

            setIsRecording(true)
            setDuration(0)
            setAudioBlob(null)

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

            startVisualizer(stream)

        } catch (err) {
            console.error("Error accessing microphone:", err)
            alert("Could not access microphone. Please ensure permissions are granted.")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const cancelRecording = () => {
        stopRecording()
        setAudioBlob(null)
        setDuration(0)
        chunksRef.current = []
        setLiveTranscript("")
        setLiveTranslation("")
    }

    const startVisualizer = (stream: MediaStream) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext
        const analyser = audioContext.createAnalyser()
        analyserRef.current = analyser
        const source = audioContext.createMediaStreamSource(stream)
        sourceRef.current = source
        source.connect(analyser)

        analyser.fftSize = 256
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')

        if (!canvas || !ctx) return

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw)
            analyser.getByteFrequencyData(dataArray)

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Nice looking waveform
            const width = canvas.width;
            const height = canvas.height;
            const barWidth = (width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 255.0; // Normalized 0-1
                const barHeight = v * height * 0.8;

                const r = 100 + (v * 155);
                const g = 50 + (v * 50);
                const b = 255;

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${v + 0.2})`;
                // Centered bars
                const y = (height - barHeight) / 2;

                // Rounded caps look nice
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth - 1, barHeight, 5);
                ctx.fill();

                x += barWidth + 1;
            }
        }

        draw()
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleSave = () => {
        if (audioBlob) {
            const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
            onRecordingComplete(file)
        }
    }

    const isSplitView = targetLanguage !== 'English';

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
            {/* Visualizer & Controls Card */}
            <Card className="w-full relative overflow-hidden bg-zinc-950 border-zinc-800 shadow-2xl">
                {/* Visualizer Canvas Background */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
                    width={800}
                    height={400}
                />

                <CardContent className="relative z-10 flex flex-col items-center justify-center p-10 min-h-[350px] gap-8">

                    {/* Timer */}
                    <div className="text-7xl font-mono font-bold tracking-widest text-white tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        {formatTime(duration)}
                    </div>

                    {/* Language Selector */}
                    {!isRecording && !audioBlob && (
                        <div className="flex items-center gap-3 bg-zinc-900/80 p-1.5 pl-3 rounded-full border border-zinc-700">
                            <Globe className="h-4 w-4 text-zinc-400" />
                            <span className="text-xs text-zinc-400 font-medium mr-1">Translate to:</span>
                            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                                <SelectTrigger className="h-7 w-[120px] border-none bg-transparent hover:bg-zinc-800/50 text-white text-xs rounded-full focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUPPORTED_LANGUAGES.map(lang => (
                                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex items-center gap-6">
                        {!isRecording && !audioBlob && (
                            <Button
                                size="lg"
                                onClick={startRecording}
                                className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-500 shadow-[0_0_40px_rgba(220,38,38,0.5)] border-4 border-zinc-800 transition-all hover:scale-110 active:scale-95"
                            >
                                <Mic className="h-8 w-8 text-white" />
                            </Button>
                        )}

                        {isRecording && (
                            <div className="flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in">
                                {isPaused ? (
                                    <Button
                                        size="icon"
                                        onClick={resumeRecording}
                                        className="h-14 w-14 rounded-full bg-white hover:bg-zinc-200 text-black border-4 border-zinc-800"
                                    >
                                        <Play className="h-6 w-6 ml-1" />
                                    </Button>
                                ) : (
                                    <Button
                                        size="icon"
                                        onClick={pauseRecording}
                                        className="h-14 w-14 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white border-4 border-zinc-900"
                                    >
                                        <Pause className="h-6 w-6" />
                                    </Button>
                                )}

                                <Button
                                    size="lg"
                                    onClick={stopRecording}
                                    className="h-20 w-20 rounded-full bg-zinc-200 hover:bg-white shadow-[0_0_40px_rgba(255,255,255,0.3)] border-4 border-zinc-800 animate-pulse transition-all hover:scale-105"
                                >
                                    <Square className="h-8 w-8 text-black fill-black" />
                                </Button>
                            </div>
                        )}

                        {audioBlob && !isRecording && (
                            <div className="flex gap-4 animate-in slide-in-from-bottom-4 fade-in">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={cancelRecording}
                                    className="h-14 w-14 rounded-full border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-red-500 hover:border-red-500/50 hover:bg-zinc-900"
                                >
                                    <Trash2 className="h-6 w-6" />
                                </Button>

                                <Button
                                    onClick={handleSave}
                                    className="h-14 px-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg shadow-lg shadow-indigo-900/50 border border-indigo-400/20"
                                >
                                    Process Recording
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="text-zinc-500 text-xs font-medium uppercase tracking-[0.2em]">
                        {isRecording ? "Listening & Transcribing" : audioBlob ? "Recording Paused" : "Tap to Speak"}
                    </div>
                </CardContent>
            </Card>

            {/* Live Transcript Area */}
            {(liveTranscript || isRecording) && (
                <div className={`grid gap-4 ${isSplitView ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Original */}
                    <Card className="bg-zinc-900/50 border-zinc-800 max-h-[300px] flex flex-col overflow-hidden">
                        <div className="p-2 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between sticky top-0">
                            <span>Original Audio</span>
                            {isRecording && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                        </div>
                        <CardContent className="p-4 overflow-y-auto font-mono text-sm text-zinc-300 leading-relaxed" ref={transcriptRef}>
                            {liveTranscript || <span className="text-zinc-600 italic">Waiting...</span>}
                        </CardContent>
                    </Card>

                    {/* Translation */}
                    {isSplitView && (
                        <Card className="bg-indigo-950/20 border-indigo-500/20 max-h-[300px] flex flex-col overflow-hidden">
                            <div className="p-2 border-b border-indigo-500/20 bg-indigo-950/30 backdrop-blur text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 sticky top-0">
                                <Sparkles className="h-3 w-3" />
                                <span>{targetLanguage} Translation</span>
                            </div>
                            <CardContent className="p-4 overflow-y-auto font-mono text-sm text-indigo-200 leading-relaxed" ref={translationRef}>
                                {liveTranslation || <span className="text-indigo-500/50 italic">Translating...</span>}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
