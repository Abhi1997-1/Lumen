'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { ChevronLeft, Upload, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { createMeeting } from '@/app/actions'
import { PremiumProcessingOverlay } from '@/components/ui/premium-processing-overlay'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AudioRecorder } from "@/components/audio-recorder"

import { useSearchParams } from 'next/navigation'

// ...

export default function NewMeetingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'upload'

    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [file, setFile] = useState<File | null>(null)

    // Compression State
    const [compressing, setCompressing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [statusText, setStatusText] = useState('')

    // Use 'any' for the ref because FFmpeg types are loaded continuously
    const ffmpegRef = useRef<any>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const compressAudio = async (inputFile: File): Promise<File> => {
        setCompressing(true)
        setStatusText('Loading compression engine...')

        try {
            // Dynamic import to avoid SSR 'no nodejs support' error
            const { FFmpeg } = await import('@ffmpeg/ffmpeg')
            const { fetchFile, toBlobURL } = await import('@ffmpeg/util')

            // Load FFmpeg if not loaded or if ref is null
            if (!ffmpegRef.current) {
                const ffmpeg = new FFmpeg()

                // Load the WASM core
                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
                await ffmpeg.load({
                    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                })

                ffmpegRef.current = ffmpeg
            }

            const ffmpeg = ffmpegRef.current

            setStatusText('Compressing audio... (This uses your device power)')

            ffmpeg.on('progress', ({ progress }: { progress: number }) => {
                setProgress(Math.round(progress * 100))
            })

            const inputName = 'input' + inputFile.name.substring(inputFile.name.lastIndexOf('.'))
            const outputName = 'output.mp3'

            await ffmpeg.writeFile(inputName, await fetchFile(inputFile))

            // Standard voice optimization: Mono, 16kHz, 32kbps MP3
            await ffmpeg.exec([
                '-i', inputName,
                '-ac', '1',
                '-ar', '16000',
                '-map', '0:a',
                '-b:a', '32k',
                outputName
            ])

            const data = await ffmpeg.readFile(outputName)

            // Create new File from compressed blob
            const blob = new Blob([data], { type: 'audio/mp3' })
            const originalName = inputFile.name.substring(0, inputFile.name.lastIndexOf('.'))
            return new File([blob], `${originalName}.mp3`, { type: 'audio/mp3' })

        } catch (error) {
            console.error('Compression error:', error)
            throw new Error('Failed to compress audio. Please try a smaller file or different format.')
        } finally {
            setCompressing(false)
            setProgress(0)
        }
    }

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

            // Check if compression is needed (> 50MB) (Only if actually uploaded, recorded files are usually small webm/mp3 but good to check)
            const MAX_SIZE_MB = 50
            if (fileToProcess.size > MAX_SIZE_MB * 1024 * 1024) {
                toast.info(`File is large (${(fileToProcess.size / 1024 / 1024).toFixed(1)}MB). Compressing...`)
                fileToUpload = await compressAudio(fileToProcess)
                toast.success(`Compressed to ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB`)
            }

            setStatusText('Uploading...')

            const userId = user.id
            const timestamp = Date.now()
            // Sanitize filename
            const sanitizedFileName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const filePath = `${userId}/${timestamp}-${sanitizedFileName}`

            const { error: uploadError } = await supabase.storage
                .from('meetings')
                .upload(filePath, fileToUpload)

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

            setStatusText('Creating meeting entry...')
            const result = await createMeeting(filePath, title || fileToUpload.name)

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
        // Automatically start processing when recording is done/saved
        await processFile(recordedFile);
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
            <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
            </Link>

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

            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                    <TabsTrigger value="upload" disabled={loading}>Upload File</TabsTrigger>
                    <TabsTrigger value="record" disabled={loading}>Record Audio</TabsTrigger>
                </TabsList>

                <TabsContent value="upload">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Audio</CardTitle>
                            <CardDescription>Upload an existing recording (MP3, WAV, M4A).</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="grid gap-6">
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
                    status={statusText || (compressing ? 'Compressing...' : 'Uploading...')}
                    progress={compressing ? progress : (statusText.includes('Uploading') ? 45 : 90)}
                />
            )}
        </div>
    )
}
