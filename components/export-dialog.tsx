'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Download, FileText, Package, Loader2, File } from "lucide-react"
import { exportMeeting, type ExportFormat } from '@/lib/export/service'
import { toast } from 'sonner'

interface ExportDialogProps {
    meeting: any // Will match Meeting type from service
    trigger?: React.ReactNode
}

export function ExportDialog({ meeting, trigger }: ExportDialogProps) {
    const [open, setOpen] = useState(false)
    const [format, setFormat] = useState<ExportFormat>('md')
    const [options, setOptions] = useState({
        includeTranscript: true,
        includeSummary: true,
        includeActionItems: true,
        includeKeyTopics: true,
        includeAudio: false,
        includeMetadata: false
    })
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        setLoading(true)
        try {
            await exportMeeting(meeting, { format, ...options })
            toast.success('Export started! Check your downloads folder.')
            setOpen(false)
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Export failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Meeting</DialogTitle>
                    <DialogDescription>
                        Download your meeting data in your preferred format
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Format Selection */}
                    <div className="space-y-2">
                        <Label>Export Format</Label>
                        <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="md">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Markdown (.md) - Recommended
                                    </div>
                                </SelectItem>
                                <SelectItem value="txt">
                                    <div className="flex items-center gap-2">
                                        <File className="h-4 w-4" />
                                        Plain Text (.txt)
                                    </div>
                                </SelectItem>
                                <SelectItem value="pdf">PDF Document (.pdf)</SelectItem>
                                <SelectItem value="json">JSON Data (.json)</SelectItem>
                                <SelectItem value="srt">Subtitles (.srt)</SelectItem>
                                <SelectItem value="zip">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Complete Package (.zip)
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* What to Include */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Include in Export</Label>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="transcript"
                                    checked={options.includeTranscript}
                                    onCheckedChange={(checked) =>
                                        setOptions({ ...options, includeTranscript: !!checked })
                                    }
                                />
                                <label htmlFor="transcript" className="text-sm cursor-pointer flex-1">
                                    Transcript
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="summary"
                                    checked={options.includeSummary}
                                    onCheckedChange={(checked) =>
                                        setOptions({ ...options, includeSummary: !!checked })
                                    }
                                />
                                <label htmlFor="summary" className="text-sm cursor-pointer flex-1">
                                    Summary
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="actions"
                                    checked={options.includeActionItems}
                                    onCheckedChange={(checked) =>
                                        setOptions({ ...options, includeActionItems: !!checked })
                                    }
                                />
                                <label htmlFor="actions" className="text-sm cursor-pointer flex-1">
                                    Action Items
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="topics"
                                    checked={options.includeKeyTopics}
                                    onCheckedChange={(checked) =>
                                        setOptions({ ...options, includeKeyTopics: !!checked })
                                    }
                                />
                                <label htmlFor="topics" className="text-sm cursor-pointer flex-1">
                                    Key Topics
                                </label>
                            </div>

                            {(format === 'zip' || format === 'json') && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="metadata"
                                        checked={options.includeMetadata}
                                        onCheckedChange={(checked) =>
                                            setOptions({ ...options, includeMetadata: !!checked })
                                        }
                                    />
                                    <label htmlFor="metadata" className="text-sm cursor-pointer flex-1">
                                        Metadata (sentiment, word count, etc.)
                                    </label>
                                </div>
                            )}

                            {format === 'zip' && meeting.audio_url && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="audio"
                                        checked={options.includeAudio}
                                        onCheckedChange={(checked) =>
                                            setOptions({ ...options, includeAudio: !!checked })
                                        }
                                    />
                                    <label htmlFor="audio" className="text-sm cursor-pointer flex-1">
                                        Audio File (increases download size)
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {format === 'pdf' && (
                        <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                            Note: PDF export may truncate very long transcripts
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
