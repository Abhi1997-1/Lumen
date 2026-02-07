'use client'

import { useState, useRef, useEffect } from 'react'
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
import { useAudioCompressor } from '@/hooks/use-audio-compressor'
import { ProviderSelector } from '@/components/provider-selector'
import { ModelSelector } from '@/components/model-selector'
import { getProviderStatus } from './actions'

// ...

export default function NewMeetingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'upload'

    const [loading, setLoading] = useState(false)
    const [statusText, setStatusText] = useState('')
    const [title, setTitle] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [selectedProvider, setSelectedProvider] = useState('gemini')
    const [selectedModel, setSelectedModel] = useState('gemini-flash')
    const [tier, setTier] = useState('free')

    useEffect(() => {
        getProviderStatus().then(status => {
            if (status.tier) setTier(status.tier)
            if (status.tier === 'pro') setSelectedModel('gemini-flash')
        })
    }, [])

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { compressAudio, isCompressing, progress: compressionProgress } = useAudioCompressor()

    // Combined progress for UI
    // If compressing: 0-100 based on compressionProgress
    // If uploading: we don't have real upload progress from supabase client yet, so we fake it or use a step.
    // Let's say: Compression is 0-50%, Upload/Process is 50-100%
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

            // Check if compression is needed (> 50MB) OR if user requested "Best" (always compress large files? Or maybe just > 10MB?)
            // For now, let's stick to the 50MB trigger for auto-compression to avoid slowing down small uploads unnecessarily.
            // BUT, user asked for "Best compressor". Maybe we should lower threshold to 10MB?
            const MAX_raw_MB = 10
            if (fileToProcess.size > MAX_raw_MB * 1024 * 1024) {
                setStatusText('Compressing audio... (This uses your device power)')
                toast.info(`Optimizing file (${(fileToProcess.size / 1024 / 1024).toFixed(1)}MB)...`)

                // Using our new "Best" settings: Mono, 24kHz, 48kbps
                fileToUpload = await compressAudio(fileToProcess, {
                    bitrate: '48k',
                    sampleRate: '22050'
                })

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
            const result = await createMeeting(filePath, title || fileToUpload.name, 0, selectedProvider, selectedModel)

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

                <div className="flex items-center justify-between">
                    {tier === 'pro' ? (
                        <ModelSelector value={selectedModel} onValueChange={setSelectedModel} disabled={loading} />
                    ) : (
                        <ProviderSelector onProviderChange={setSelectedProvider} disabled={loading} />
                    )}
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
                        status={statusText || (isCompressing ? 'Compressing...' : 'Uploading...')}
                        progress={isCompressing ? compressionProgress : (statusText.includes('Uploading') ? 45 : 90)}
                    />
                )}
            </div>
        </div>
    )
}

