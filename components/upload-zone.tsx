'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { UploadCloud, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createMeeting } from '@/app/actions'
import { cn } from '@/lib/utils'

export function UploadZone() {
    const [isUploading, setIsUploading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setIsUploading(true)
        const toastId = toast.loading("Uploading audio...")

        try {
            // 1. Get Audio Duration
            const durationSeconds = await new Promise<number>((resolve) => {
                const audio = new Audio(URL.createObjectURL(file));
                audio.onloadedmetadata = () => {
                    resolve(audio.duration);
                    URL.revokeObjectURL(audio.src); // Cleanup
                };
                audio.onerror = () => resolve(0); // Fallback if format not supported by browser
            });

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Please log in")

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('meetings')
                .upload(`${user.id}/${Date.now()}-${file.name}`, file)

            if (uploadError) throw uploadError

            toast.loading("Processing with Gemini...", { id: toastId })

            const result = await createMeeting(uploadData.path, '', Math.ceil(durationSeconds))

            if (result.success) {
                toast.success("Meeting processed!", { id: toastId })
                // Redirect to meeting detail (not implemented yet)
                // router.push(`/dashboard/meeting/${result.meetingId}`)
                toast.message("Redirecting to meeting details...")
            } else {
                throw new Error(result.error)
            }

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Upload failed", { id: toastId })
        } finally {
            setIsUploading(false)
        }
    }, [supabase, router])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'audio/*': ['.mp3', '.wav', '.m4a'] },
        maxFiles: 1,
        disabled: isUploading
    })

    return (
        <div
            {...getRootProps()}
            className={cn(
                "flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center transition-colors cursor-pointer hover:bg-muted/50",
                isDragActive && "bg-muted/50 border-primary",
                isUploading && "pointer-events-none opacity-50"
            )}
        >
            <input {...getInputProps()} />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-secondary-foreground" />
                ) : (
                    <UploadCloud className="h-6 w-6 text-secondary-foreground" />
                )}
            </div>
            <h3 className="mt-4 text-lg font-semibold">
                {isUploading ? "Processing..." : "Upload Meeting Audio"}
            </h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                {isUploading
                    ? "We are transcribing and summarizing your meeting. This may take a moment."
                    : "Drag & drop MP3, WAV, or M4A files here, or click to select."}
            </p>
            {!isUploading && <Button variant="outline">Select File</Button>}
        </div>
    )
}
