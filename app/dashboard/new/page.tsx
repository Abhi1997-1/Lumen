"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ChevronLeft, Upload, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { createMeeting } from '@/app/actions'
import { PremiumProcessingOverlay } from '@/components/ui/premium-processing-overlay'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AudioRecorder } from "@/components/audio-recorder"
import { ModelSelector } from "@/components/model-selector" // Import

import { useSearchParams } from 'next/navigation'
import { useAudioCompressor } from '@/hooks/use-audio-compressor'

export default function NewMeetingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'upload'

    const [loading, setLoading] = useState(false)
    const [statusText, setStatusText] = useState('')
    const [title, setTitle] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile") // Default

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { compressAudio, isCompressing, progress: compressionProgress } = useAudioCompressor()

    // Combined progress: Compression 0-50%, Upload/Process 50-100%
    const displayProgress = isCompressing
        ? compressionProgress
        : (statusText.includes('Uploading') ? 60 : (statusText.includes('Creating') ? 90 : 0))

    const processFile = async (fileToProcess: File) => {
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error("Please log in again")
                router.push('/login')
                return
            }

            let fileToUpload = fileToProcess

            // Compression for large files
            const MAX_raw_MB = 10
            if (fileToProcess.size > MAX_raw_MB * 1024 * 1024) {
                setStatusText('Compressing audio...')
                toast.info(`Optimizing file (${(fileToProcess.size / 1024 / 1024).toFixed(1)}MB)...`)
                fileToUpload = await compressAudio(fileToProcess, {
                    bitrate: '48k',
                    sampleRate: '22050'
                })
                toast.success(`Compressed to ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB`)
            }

            // Upload file
            setStatusText('Uploading audio...')
            const userId = user.id
            const timestamp = Date.now()
            const sanitizedFileName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const filePath = `${userId}/${timestamp}-${sanitizedFileName}`

            const { error: uploadError } = await supabase.storage
                .from('meetings')
                .upload(filePath, fileToUpload)

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

            // Server Transcription (Groq Whisper + Llama Analysis)
            setStatusText('Processing with Groq AI...')

            // Note: createMeeting now defaults to Groq internally
            const result = await createMeeting(
                filePath,
                title || fileToUpload.name,
                0,
                false,
                selectedModel // Pass Model
            )

            if (!result.success) throw new Error(result.error)

            toast.success('Meeting created successfully!')
            router.push(`/dashboard/${result.meetingId}`)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to create meeting')
        } finally {
            setLoading(false)
            setStatusText('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) {
            toast.error("Please upload a file")
            return
        }
        await processFile(file);
    }

    const handleRecordingComplete = async (recordedFile: File) => {
        await processFile(recordedFile);
    }

    return (
        <div className="flex flex-col h-full p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
                </Link>
            </div>

            <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
                <div className="grid gap-2 mb-2">
                    <Label htmlFor="title">Meeting Title (Optional)</Label>
                    <Input
                        id="title"
                        placeholder="e.g. Weekly Standup"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {/* Simplified Upload/Record Tabs */}
                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                        <TabsTrigger value="upload" disabled={loading}>Upload File</TabsTrigger>
                        <TabsTrigger value="record" disabled={loading}>Record Audio</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload">
                        <Card>
                            <CardHeader>
                                <CardTitle>Upload Audio</CardTitle>
                                <CardDescription>Upload an existing recording (MP3, WAV, M4A). Processed by Groq AI.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="grid gap-6">
                                    {/* Model Selector */}
                                    <div className="grid gap-2">
                                        <Label>AI Model</Label>
                                        <ModelSelector value={selectedModel} onValueChange={setSelectedModel} disabled={loading} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="file">Select File</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="file"
                                                type="file"
                                                accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.webm,.aac"
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                className="cursor-pointer"
                                                disabled={loading}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground flex justify-between">
                                            <span>Supported: MP3, WAV, M4A, FLAC, OGG, WEBM, AAC</span>
                                            {file && <span>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</span>}
                                        </p>

                                        {/* Auto-Compression Notice */}
                                        {file && file.size > 50 * 1024 * 1024 && (
                                            <div className="rounded-md bg-blue-500/10 p-3 text-xs text-blue-500 border border-blue-500/20 flex items-start gap-2">
                                                <RefreshCw className="h-4 w-4 shrink-0 mt-0.5 animate-spin-slow" />
                                                <div>
                                                    <span className="font-semibold">Large File Detected:</span> This file will be automatically compressed before upload to ensure fast processing and stay within free limits.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>

                                <CardContent className="pt-0 flex justify-end">
                                    <Button type="submit" disabled={loading || !file}>
                                        {loading ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" /> Upload & Process
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="record">
                        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                    </TabsContent>
                </Tabs>

                {/* Premium Loading Overlay */}
                {loading && (
                    <PremiumProcessingOverlay
                        status={statusText || (isCompressing ? 'Compressing...' : 'Uploading...')}
                        progress={displayProgress}
                    />
                )}
            </div>
        </div>
    )
}
