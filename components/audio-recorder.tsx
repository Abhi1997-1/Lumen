"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Square, Trash2, StopCircle, Play, Pause } from "lucide-react"

interface AudioRecorderProps {
    onRecordingComplete: (file: File) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [duration, setDuration] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [isPaused, setIsPaused] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const chunksRef = useRef<Blob[]>([])

    // Visualizer refs
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
            if (audioContextRef.current) audioContextRef.current.close()
        }
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setAudioBlob(blob)
                stopVisualizer()

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setIsPaused(false)
            setDuration(0)
            setAudioBlob(null)

            // Start Timer
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

            // Start Visualizer
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
            setIsPaused(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const cancelRecording = () => {
        stopRecording()
        setAudioBlob(null)
        setDuration(0)
        chunksRef.current = []
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

            ctx.fillStyle = 'rgb(0, 0, 0)' // Or transparent clear
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const barWidth = (canvas.width / bufferLength) * 2.5
            let barHeight
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2

                // Gradient or simple color
                ctx.fillStyle = `rgb(${barHeight + 100}, 50, 255)`
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

                x += barWidth + 1
            }
        }

        draw()
    }

    const stopVisualizer = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        if (audioContextRef.current) audioContextRef.current.close()
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

    return (
        <Card className="w-full h-[400px] flex flex-col items-center justify-center bg-zinc-950 border-zinc-800 relative overflow-hidden">
            {/* Background Visualizer Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
                width={600}
                height={400}
            />

            <div className="z-10 flex flex-col items-center gap-8 w-full max-w-md p-6">
                {/* Timer Display */}
                <div className="text-6xl font-mono font-bold tracking-widest text-white tabular-nums drop-shadow-lg">
                    {formatTime(duration)}
                </div>

                {/* Status Text */}
                <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
                    {isRecording ? "Listening..." : audioBlob ? "Recording Complete" : "Ready to Record"}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                    {!isRecording && !audioBlob && (
                        <Button
                            size="lg"
                            onClick={startRecording}
                            className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-700 shadow-[0_0_30px_rgba(220,38,38,0.4)] border-4 border-zinc-900 transition-transform hover:scale-105"
                        >
                            <Mic className="h-8 w-8 text-white" />
                        </Button>
                    )}

                    {isRecording && (
                        <Button
                            size="lg"
                            onClick={stopRecording}
                            className="h-20 w-20 rounded-full bg-zinc-100 hover:bg-white shadow-[0_0_30px_rgba(255,255,255,0.2)] border-4 border-zinc-900 animate-pulse transition-transform hover:scale-105"
                        >
                            <Square className="h-8 w-8 text-black fill-black" />
                        </Button>
                    )}

                    {audioBlob && !isRecording && (
                        <div className="flex gap-4 animate-in zoom-in slide-in-from-bottom-5 duration-300">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={cancelRecording}
                                className="h-14 w-14 rounded-full border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-red-500 hover:border-red-500/50"
                            >
                                <Trash2 className="h-6 w-6" />
                            </Button>

                            <Button
                                onClick={handleSave}
                                className="h-14 px-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg shadow-lg shadow-emerald-900/50"
                            >
                                Process Recording
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}
