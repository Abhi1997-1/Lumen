"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { createMeeting } from "@/app/actions"
import { Mic, Square, Loader2, Signal, VideoOff } from "lucide-react"

interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

export function LiveRecorder() {
    const router = useRouter()
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState<string[]>([])
    const [recordingTime, setRecordingTime] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [volume, setVolume] = useState(0)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const recognitionRef = useRef<any>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        return () => {
            stopStream()
            if (timerRef.current) clearInterval(timerRef.current)
            if (audioContextRef.current) audioContextRef.current.close()
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        }
    }, [])

    const setupAudioVisualizer = (stream: MediaStream) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }

        const context = audioContextRef.current
        const source = context.createMediaStreamSource(stream)
        const analyser = context.createAnalyser()
        analyser.fftSize = 32
        source.connect(analyser)
        analyserRef.current = analyser

        const updateVolume = () => {
            const dataArray = new Uint8Array(analyser.frequencyBinCount)
            analyser.getByteFrequencyData(dataArray)
            const sum = dataArray.reduce((curr, a) => curr + a, 0)
            const avg = sum / dataArray.length
            setVolume(avg) // 0-255
            animationFrameRef.current = requestAnimationFrame(updateVolume)
        }
        updateVolume()
    }

    const startRecording = async () => {
        try {
            // 1. Get Mic Stream ONLY
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: true
            })

            // 2. Setup Visualizer & Stream
            setupAudioVisualizer(micStream)
            streamRef.current = micStream

            // 3. Initialize MediaRecorder (Audio Only)
            let mediaRecorder;
            try {
                mediaRecorder = new MediaRecorder(micStream)
            } catch (e: any) {
                console.error("MediaRecorder init failed:", e)
                toast.error(`Recorder init failed: ${e.message}`)
                return;
            }

            chunksRef.current = []
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.start(1000)
            mediaRecorderRef.current = mediaRecorder

            // 4. Initialize Speech Recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.continuous = true
                recognition.interimResults = true
                recognition.lang = 'en-US'

                recognition.onresult = (event: any) => {
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            setTranscript(prev => [...prev, event.results[i][0].transcript])
                        }
                    }
                }

                recognition.onerror = (event: any) => {
                    console.warn("Speech recognition error", event.error)
                    if (event.error === 'not-allowed') {
                        toast.error("Microphone access denied for transcript.")
                    }
                }

                // Auto-restart on end if still recording
                recognition.onend = () => {
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                        try {
                            recognition.start()
                            console.log("Restarting speech recognition...")
                        } catch (e) {
                            console.error("Could not restart recognition", e)
                        }
                    }
                }

                try {
                    recognition.start()
                    recognitionRef.current = recognition
                } catch (e) {
                    console.error("Speech recognition start failed", e)
                }
            } else {
                setTranscript(prev => [...prev, "[Browser does not support Live Speech API]"])
                toast.warning("Your browser does not support live captions.")
            }

            setIsRecording(true)

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

        } catch (error: any) {
            console.error("Error starting recording:", error)
            toast.error(`Could not start recording: ${error.message}`)
        }
    }

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
        }
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        setVolume(0)
    }

    const stopRecording = async () => {
        if (!mediaRecorderRef.current || !isRecording) return

        mediaRecorderRef.current.stop()
        if (recognitionRef.current) recognitionRef.current.stop()
        if (timerRef.current) clearInterval(timerRef.current)
        stopStream()

        setIsRecording(false)
        setIsUploading(true)

        setTimeout(async () => {
            await uploadRecording()
        }, 500)
    }

    const uploadRecording = async () => {
        try {
            const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
            const ext = mimeType.includes('mp4') ? 'm4a' : 'webm' // Audio exts

            const blob = new Blob(chunksRef.current, { type: mimeType })
            const file = new File([blob], `audio-recording-${Date.now()}.${ext}`, { type: mimeType })

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error("User not found. Could not upload.")
                setIsUploading(false)
                return
            }

            const timestamp = Date.now()
            const filePath = `${user.id}/${timestamp}-live-audio.${ext}`

            toast.info("Uploading audio...")
            const { error: uploadError } = await supabase.storage
                .from('meetings')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            toast.info("Creating meeting...")
            const result = await createMeeting(filePath, `Audio Recording ${new Date().toLocaleTimeString()}`, recordingTime)

            if (result.success) {
                toast.success("Saved! Processing started.")
                router.push(`/dashboard/${result.meetingId}`)
            } else {
                throw new Error(result.error)
            }

        } catch (error: any) {
            console.error("Upload failed:", error)
            toast.error(`Upload failed: ${error.message}`)
            setIsUploading(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            <div className="lg:col-span-2 flex flex-col gap-4">
                <Card className="flex-1 bg-[#0a0a0a] border-[#1F2128] overflow-hidden relative flex items-center justify-center p-8 group">

                    {/* Visualizer Circles */}
                    {isRecording && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-64 bg-red-600/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                            <div
                                className="w-40 h-40 bg-red-600/20 rounded-full absolute transition-all duration-75 ease-out"
                                style={{ transform: `scale(${1 + volume / 100})` }}
                            />
                        </div>
                    )}

                    <div className="text-center space-y-6 z-10 relative">
                        {isUploading ? (
                            <>
                                <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto" />
                                <h3 className="text-2xl font-semibold text-white">Uploading & Processing...</h3>
                                <p className="text-zinc-400">Please wait while we save your session.</p>
                            </>
                        ) : isRecording ? (
                            <>
                                <div className="text-6xl font-mono font-bold text-white tracking-wider tabular-nums">
                                    {formatTime(recordingTime)}
                                </div>
                                <p className="text-zinc-400 flex items-center justify-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    Recording Material
                                </p>
                                <Button
                                    size="lg"
                                    variant="destructive"
                                    onClick={stopRecording}
                                    className="h-16 w-16 rounded-full shadow-2xl shadow-red-900/50 hover:scale-105 transition-transform mt-8"
                                >
                                    <Square className="h-6 w-6 fill-current" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="h-32 w-32 bg-[#14161B] rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-zinc-800 shadow-2xl">
                                    <Mic className="h-12 w-12 text-zinc-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Audio Recorder</h3>
                                    <p className="text-zinc-400 max-w-sm mx-auto">
                                        Use your microphone to capture ideas, meetings, or voice notes.
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    onClick={startRecording}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-full px-10 py-6 text-lg shadow-lg shadow-red-600/20 mt-4"
                                >
                                    Start Recording
                                </Button>
                            </>
                        )}
                    </div>
                </Card>
            </div>

            <div className="flex flex-col h-full bg-[#0F1116] border border-[#1F2128] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#1F2128] bg-[#14161B] flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <Signal className="h-4 w-4 text-blue-500" />
                        Live Transcript
                    </h3>
                    <Badge variant="outline" className={isRecording ? "border-green-500/30 text-green-500 bg-green-500/10" : "border-zinc-800 text-zinc-500"}>
                        {isRecording ? 'Listening...' : 'Offline'}
                    </Badge>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm custom-scrollbar">
                    {transcript.length === 0 ? (
                        <div className="text-center text-zinc-500 py-12 italic">
                            {isRecording ? "Listening for speech..." : "Start recording to see transcript..."}
                        </div>
                    ) : (
                        transcript.map((text, i) => (
                            <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="text-zinc-500 text-xs shrink-0 pt-1">
                                    {formatTime(recordingTime)}
                                </div>
                                <p className="text-zinc-300 bg-zinc-800/50 p-2 rounded-lg rounded-tl-none">
                                    {text}
                                </p>
                            </div>
                        ))
                    )}
                    <div className="h-0" />
                </div>
                <div className="p-3 border-t border-[#1F2128] bg-[#14161B] text-xs text-zinc-500 text-center">
                    Preview powered by Browser Speech API
                </div>
            </div>
        </div>
    )
}
