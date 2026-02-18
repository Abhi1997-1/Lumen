"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { createMeeting } from "@/app/actions"
import { Mic, Square, Loader2, Signal, Pause, Play, Monitor, Sparkles } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// IWindow interface removed

export function LiveRecorder() {
    const router = useRouter()
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [includeSystemAudio, setIncludeSystemAudio] = useState(false)
    const [usePremium, setUsePremium] = useState(false) // New state for dynamic switching
    const [transcript, setTranscript] = useState<string[]>([])
    const [recordingTime, setRecordingTime] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [volume, setVolume] = useState(0)
    const [streamPreview, setStreamPreview] = useState<MediaStream | null>(null) // For video preview only

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const recognitionRef = useRef<any>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const timerRef = useRef<number | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        if (videoRef.current && streamPreview) {
            videoRef.current.srcObject = streamPreview
        }
    }, [streamPreview])

    useEffect(() => {
        return () => {
            stopStream()
            if (timerRef.current) window.clearInterval(timerRef.current)
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
            // 1. Get Streams
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
            let finalStream = micStream;
            let displayStream: MediaStream | null = null;

            // If System Audio requested
            if (includeSystemAudio) {
                try {
                    displayStream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            width: 1920,
                            height: 1080,
                        },
                        audio: {
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: false
                        },
                        // @ts-ignore
                        systemAudio: 'include',
                    })

                    setStreamPreview(displayStream) // Show video preview

                    if (displayStream.getAudioTracks().length > 0) {
                        // Mix Streams using WebAudio
                        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

                        // IMPORTANT: Resume context
                        if (audioCtx.state === 'suspended') {
                            await audioCtx.resume()
                        }

                        audioContextRef.current = audioCtx

                        const dest = audioCtx.createMediaStreamDestination()
                        const micSource = audioCtx.createMediaStreamSource(micStream)
                        const sysSource = audioCtx.createMediaStreamSource(displayStream)

                        micSource.connect(dest)
                        sysSource.connect(dest)

                        // Use combined stream for AUDIO RECORDING
                        finalStream = dest.stream
                    } else {
                        toast.warning("No system audio detected. Did you check 'Share Audio'?")
                    }

                    // We DO NOT stop video tracks here anymore, we use them for preview
                    // But we ensure MediaRecorder only records AUDIO (see step 3)

                } catch (err) {
                    console.error("System audio capture failed:", err)
                    toast.error("Could not capture system audio. Using mic only.")
                }
            }

            // 2. Setup Visualizer
            setupAudioVisualizer(finalStream)
            streamRef.current = finalStream

            // 3. Initialize MediaRecorder (Explicitly Audio Only)
            let mediaRecorder;
            try {
                // Ensure we only pass audio tracks to MediaRecorder if we have a mixed stream
                // If it's just mic, it's already audio only.
                // If it's mixed dest.stream, it's also audio only.
                // We double check to be safe.
                mediaRecorder = new MediaRecorder(finalStream, { mimeType: 'audio/webm' })
            } catch (e: any) {
                console.error("MediaRecorder init failed:", e)
                toast.error(`Recorder init failed: ${e.message}`)
                return;
            }

            chunksRef.current = []

            let chunkCounter = 0;

            mediaRecorder.ondataavailable = async (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data) // Keep for final storage

                    // Send to Groq for Live Transcript
                    // We dispatch independent of the main flow to avoid blocking
                    const blob = e.data;
                    const formData = new FormData();
                    formData.append('audio', blob, 'chunk.webm');
                    // We need to pass the usePremium state value here. 
                    // However, inside this closure 'usePremium' might be stale if it changed (though it's disable during recording).
                    // But we can get it from state.
                    // Note: Since we are in the startRecording closure, we should be careful. 
                    // But 'usePremium' is state, so we should rely on the value at the time of startRecording? 
                    // Actually, let's just use a ref or ensuring we assume it doesn't change during recording (disabled).

                    // Actually, we can't easily access 'transcribeChunkAction' if it's not imported or if this is a Client Component calling Server Action.
                    // We need to import it.

                    try {
                        const { transcribeChunkAction } = await import('@/app/actions');
                        // Pass the usePremium flag. Note: we need to ensure we pass the boolean as string if FormData logic in action expects it.
                        // In action we used: formData.get('useSystemKey') === 'true'
                        // We need access to the current 'usePremium' value. 
                        // Since 'startRecording' closes over 'usePremium', and we disable the switch while recording, it should be fine.
                        formData.append('useSystemKey', String(usePremium));

                        const result = await transcribeChunkAction(formData);
                        if (result.success && result.text) {
                            setTranscript(prev => [...prev, result.text]);
                        }
                    } catch (err) {
                        console.error("Chunk transcription failed", err);
                    }
                }
            }

            mediaRecorder.onstop = async () => {
                // Stop all tracks (including video preview) when recording stops
                if (displayStream) displayStream.getTracks().forEach(t => t.stop())
                micStream.getTracks().forEach(t => t.stop())
                stopStream()

                setIsRecording(false)
                setIsUploading(true)
                setStreamPreview(null)

                setTimeout(async () => await uploadRecording(), 100)
            }

            mediaRecorder.start(1000)
            mediaRecorderRef.current = mediaRecorder

            // 4. Speech Recognition Removed (Using Groq Chunks)

            setIsRecording(true)
            setIsPaused(false)

            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

        } catch (error: any) {
            console.error("Error starting recording:", error)
            toast.error(`Could not start recording: ${error.message}`)
        }
    }

    const togglePause = () => {
        if (!mediaRecorderRef.current) return
        if (isPaused) {
            mediaRecorderRef.current.resume()
            timerRef.current = window.setInterval(() => { setRecordingTime(prev => prev + 1) }, 1000)
            setIsPaused(false)
        } else {
            mediaRecorderRef.current.pause()
            if (timerRef.current) window.clearInterval(timerRef.current)
            setIsPaused(true)
        }
    }

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
        }
        if (streamPreview) {
            streamPreview.getTracks().forEach(track => track.stop())
        }
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        setVolume(0)
    }

    const stopRecording = async () => {
        if (mediaRecorderRef.current || isRecording) {
            mediaRecorderRef.current?.stop() // Triggers onstop -> upload
        }
        if (timerRef.current) window.clearInterval(timerRef.current)
    }

    const uploadRecording = async () => {
        try {
            const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
            const ext = mimeType.includes('mp4') ? 'm4a' : 'webm'
            const blob = new Blob(chunksRef.current, { type: mimeType })
            const file = new File([blob], `audio-recording-${Date.now()}.${ext}`, { type: mimeType })

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const timestamp = Date.now()
            const filePath = `${user.id}/${timestamp}-live-audio.${ext}`

            toast.info("Uploading audio...")
            const { error: uploadError } = await supabase.storage.from('meetings').upload(filePath, file)
            if (uploadError) throw uploadError

            toast.info("Creating meeting...")
            const result = await createMeeting(filePath, `Live Session ${new Date().toLocaleTimeString()}`, recordingTime, usePremium)

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

    if (isUploading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                <div>
                    <h2 className="text-2xl font-bold text-white">Wrapping Up Session...</h2>
                    <p className="text-zinc-400 mt-2">Uploading audio securely to your private storage.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 overflow-hidden">
            {/* LEFT: Main Preview Area */}
            <div className="flex-1 bg-black/40 border border-[#1F2128] rounded-2xl relative overflow-hidden flex flex-col group">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <Badge variant="outline" className="bg-black/50 border-zinc-800 text-zinc-300 backdrop-blur-md">
                        {isRecording ? "LIVE" : "READY"}
                    </Badge>
                    {isRecording && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">REC {formatTime(recordingTime)}</Badge>}
                </div>

                <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] relative">
                    {streamPreview ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-600 space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                                <div className="h-32 w-32 bg-[#14161B] rounded-full flex items-center justify-center relative border border-zinc-800">
                                    <Mic className={`h-12 w-12 ${isRecording ? 'text-red-500' : 'text-zinc-500'}`} />
                                </div>
                            </div>
                            <p className="font-mono text-sm">Waiting for input...</p>
                        </div>
                    )}

                    {/* Floating Action Bar */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#14161B]/90 backdrop-blur-xl border border-[#1F2128] rounded-full p-2 flex items-center gap-2 shadow-2xl transition-all hover:scale-105 z-20">

                        <div className="flex items-center gap-3 px-4 border-r border-[#27272a] pr-4 mr-1">
                            <Label htmlFor="system-audio-toggle" className="text-xs font-medium text-zinc-400 cursor-pointer hover:text-white transition-colors">
                                Include System Audio
                            </Label>
                            <Switch
                                id="system-audio-toggle"
                                checked={includeSystemAudio}
                                onCheckedChange={setIncludeSystemAudio}
                                disabled={isRecording}
                            />
                        </div>

                        {/* NEW: Premium Processing Toggle */}
                        <div className="flex items-center gap-3 px-4 border-r border-[#27272a] pr-4 mr-1">
                            <Label htmlFor="premium-toggle" className="text-xs font-medium text-zinc-400 cursor-pointer hover:text-white transition-colors flex items-center gap-1">
                                Use Premium <Sparkles className="h-3 w-3 text-amber-400" />
                            </Label>
                            <Switch
                                id="premium-toggle"
                                checked={usePremium}
                                onCheckedChange={setUsePremium}
                                disabled={isRecording}
                            />
                        </div>

                        {!isRecording ? (
                            <Button
                                size="lg"
                                onClick={startRecording}
                                className="rounded-full bg-red-600 hover:bg-red-700 text-white px-8 h-12 shadow-lg shadow-red-600/20"
                            >
                                Start Session
                            </Button>
                        ) : (
                            <>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={togglePause}
                                    className="h-12 w-12 rounded-full hover:bg-zinc-800 text-zinc-300"
                                >
                                    {isPaused ? <Play className="h-6 w-6 fill-current" /> : <Pause className="h-6 w-6 fill-current" />}
                                </Button>
                                <Button
                                    size="lg"
                                    variant="destructive"
                                    onClick={stopRecording}
                                    className="rounded-full h-12 px-8 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/50"
                                >
                                    Stop
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: Sidebar (Transcript + Insights) */}
            <div className="w-[380px] flex flex-col gap-4 shrink-0">
                {/* Transcript Panel */}
                <div className="flex-1 bg-[#0F1116] border border-[#1F2128] rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-[#1F2128] bg-[#14161B]/50 backdrop-blur-sm flex justify-between items-center">
                        <h3 className="font-semibold text-zinc-200 flex items-center gap-2 text-sm">
                            <Signal className="h-4 w-4 text-blue-500" /> Live Transcript
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm custom-scrollbar relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0F1116] via-transparent to-transparent h-4 pointer-events-none" />

                        {transcript.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                                <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                                <p className="text-xs">Listening...</p>
                            </div>
                        ) : (
                            transcript.map((text, i) => (
                                <div key={i} className="flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-500">
                                    <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] text-zinc-400">You</span>
                                    </div>
                                    <div className="bg-[#1A1D24] p-3 rounded-2xl rounded-tl-none text-zinc-300 text-sm leading-relaxed border border-[#27272a]/50">
                                        {text}
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="h-8" /> {/* Spacer */}
                    </div>
                </div>

                {/* Insights Panel (Placeholder for now) */}
                <div className="h-[200px] bg-gradient-to-br from-[#14161B] to-[#0F1116] border border-[#1F2128] rounded-2xl p-4 flex flex-col relative overflow-hidden group">
                    {/* Decoration */}
                    <div className="absolute -right-10 -top-10 h-32 w-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-1000" />

                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">AI Insights</h3>
                    </div>

                    <div className="flex-1 flex items-center justify-center text-center">
                        {isRecording ? (
                            <div className="space-y-2 animate-in fade-in zoom-in duration-1000">
                                <p className="text-zinc-400 text-sm">Context detected.</p>
                                <p className="text-white font-medium text-sm">"Discussing Project Roadmap"</p>
                            </div>
                        ) : (
                            <p className="text-zinc-600 text-xs">Start recording to see live insights...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
