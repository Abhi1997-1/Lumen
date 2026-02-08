import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'

export type ExportFormat =
    | 'txt' | 'md' | 'pdf'    // Text formats
    | 'json' | 'csv'          // Data formats
    | 'srt' | 'vtt'           // Subtitle formats
    | 'zip'                   // Package

export interface ExportOptions {
    format: ExportFormat
    includeTranscript?: boolean
    includeAudio?: boolean
    includeSummary?: boolean
    includeActionItems?: boolean
    includeKeyTopics?: boolean
    includeMetadata?: boolean
}

interface Meeting {
    id: string
    title: string
    transcript?: string
    summary?: string
    action_items?: string[]
    key_topics?: string[]
    sentiment?: string
    created_at: string
    duration?: number
    audio_url?: string
}

export async function exportMeeting(
    meeting: Meeting,
    options: ExportOptions
) {
    const format = options.format
    const filename = sanitizeFilename(meeting.title)

    switch (format) {
        case 'txt':
            return exportAsText(meeting, options, filename)
        case 'md':
            return exportAsMarkdown(meeting, options, filename)
        case 'pdf':
            return exportAsPDF(meeting, options, filename)
        case 'json':
            return exportAsJSON(meeting, options, filename)
        case 'srt':
            return exportAsSRT(meeting, filename)
        case 'zip':
            return exportAsZip(meeting, options, filename)
        default:
            throw new Error(`Unsupported format: ${format}`)
    }
}

function exportAsText(meeting: Meeting, options: ExportOptions, filename: string) {
    let content = `${meeting.title}\n`
    content += `${'='.repeat(meeting.title.length)}\n\n`
    content += `Date: ${new Date(meeting.created_at).toLocaleString()}\n\n`

    if (options.includeSummary && meeting.summary) {
        content += `SUMMARY\n-------\n${meeting.summary}\n\n`
    }

    if (options.includeKeyTopics && meeting.key_topics?.length) {
        content += `KEY TOPICS\n----------\n`
        meeting.key_topics.forEach(topic => {
            content += `• ${topic}\n`
        })
        content += '\n'
    }

    if (options.includeActionItems && meeting.action_items?.length) {
        content += `ACTION ITEMS\n------------\n`
        meeting.action_items.forEach((item, i) => {
            content += `${i + 1}. ${item}\n`
        })
        content += '\n'
    }

    if (options.includeTranscript && meeting.transcript) {
        content += `TRANSCRIPT\n----------\n${meeting.transcript}\n`
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, `${filename}.txt`)
}

function exportAsMarkdown(meeting: Meeting, options: ExportOptions, filename: string) {
    let content = `# ${meeting.title}\n\n`
    content += `**Date**: ${new Date(meeting.created_at).toLocaleString()}\n`
    if (meeting.duration) {
        content += `**Duration**: ${Math.floor(meeting.duration / 60)} minutes\n`
    }
    content += '\n---\n\n'

    if (options.includeSummary && meeting.summary) {
        content += `## Summary\n\n${meeting.summary}\n\n`
    }

    if (options.includeKeyTopics && meeting.key_topics?.length) {
        content += `## Key Topics\n\n`
        meeting.key_topics.forEach(topic => {
            content += `- ${topic}\n`
        })
        content += '\n'
    }

    if (options.includeActionItems && meeting.action_items?.length) {
        content += `## Action Items\n\n`
        meeting.action_items.forEach((item, i) => {
            content += `${i + 1}. ${item}\n`
        })
        content += '\n'
    }

    if (options.includeTranscript && meeting.transcript) {
        content += `## Transcript\n\n${meeting.transcript}\n`
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    saveAs(blob, `${filename}.md`)
}

function exportAsPDF(meeting: Meeting, options: ExportOptions, filename: string) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxWidth = pageWidth - (margin * 2)
    let y = margin

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(meeting.title, margin, y)
    y += 10

    // Date
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(`Date: ${new Date(meeting.created_at).toLocaleString()}`, margin, y)
    y += 8
    doc.setTextColor(0)

    // Summary
    if (options.includeSummary && meeting.summary) {
        y += 5
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Summary', margin, y)
        y += 8
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const summaryLines = doc.splitTextToSize(meeting.summary, maxWidth)
        doc.text(summaryLines, margin, y)
        y += summaryLines.length * 5 + 5
    }

    // Key Topics
    if (options.includeKeyTopics && meeting.key_topics?.length) {
        if (y > 250) { doc.addPage(); y = margin }
        y += 5
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Key Topics', margin, y)
        y += 8
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        meeting.key_topics.forEach(topic => {
            const topicLines = doc.splitTextToSize(`• ${topic}`, maxWidth)
            if (y + topicLines.length * 5 > 280) { doc.addPage(); y = margin }
            doc.text(topicLines, margin, y)
            y += topicLines.length * 5
        })
        y += 5
    }

    // Action Items
    if (options.includeActionItems && meeting.action_items?.length) {
        if (y > 250) { doc.addPage(); y = margin }
        y += 5
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Action Items', margin, y)
        y += 8
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        meeting.action_items.forEach((item, i) => {
            const itemLines = doc.splitTextToSize(`${i + 1}. ${item}`, maxWidth)
            if (y + itemLines.length * 5 > 280) { doc.addPage(); y = margin }
            doc.text(itemLines, margin, y)
            y += itemLines.length * 5
        })
        y += 5
    }

    // Transcript (first part only - PDFs have size limits)
    if (options.includeTranscript && meeting.transcript) {
        if (y > 250) { doc.addPage(); y = margin }
        y += 5
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Transcript', margin, y)
        y += 8
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        // Limit transcript to avoid huge PDFs
        const shortTranscript = meeting.transcript.substring(0, 5000)
        const transcriptLines = doc.splitTextToSize(shortTranscript, maxWidth)

        transcriptLines.forEach((line: string) => {
            if (y > 280) { doc.addPage(); y = margin }
            doc.text(line, margin, y)
            y += 4
        })

        if (meeting.transcript.length > 5000) {
            y += 5
            doc.setTextColor(100)
            doc.text('[Transcript truncated for PDF. Export as TXT or MD for full transcript]', margin, y)
        }
    }

    doc.save(`${filename}.pdf`)
}

function exportAsJSON(meeting: Meeting, options: ExportOptions, filename: string) {
    const data: any = {
        title: meeting.title,
        date: meeting.created_at,
        duration: meeting.duration
    }

    if (options.includeTranscript && meeting.transcript) data.transcript = meeting.transcript
    if (options.includeSummary && meeting.summary) data.summary = meeting.summary
    if (options.includeActionItems && meeting.action_items) data.actionItems = meeting.action_items
    if (options.includeKeyTopics && meeting.key_topics) data.keyTopics = meeting.key_topics
    if (options.includeMetadata) {
        data.metadata = {
            sentiment: meeting.sentiment,
            wordCount: meeting.transcript?.split(' ').length || 0,
            createdAt: meeting.created_at
        }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8'
    })
    saveAs(blob, `${filename}.json`)
}

function exportAsSRT(meeting: Meeting, filename: string) {
    if (!meeting.transcript) return

    // Generate SRT subtitle file from transcript
    // Split transcript into sentences/chunks
    const sentences = meeting.transcript.match(/[^.!?]+[.!?]+/g) || [meeting.transcript]
    let srt = ''

    sentences.forEach((sentence, i) => {
        const startTime = formatSRTTime(i * 4) // 4 seconds per sentence
        const endTime = formatSRTTime((i + 1) * 4)
        srt += `${i + 1}\n${startTime} --> ${endTime}\n${sentence.trim()}\n\n`
    })

    const blob = new Blob([srt], { type: 'text/srt;charset=utf-8' })
    saveAs(blob, `${filename}.srt`)
}

async function exportAsZip(meeting: Meeting, options: ExportOptions, filename: string) {
    const zip = new JSZip()

    // Add markdown version
    if (options.includeTranscript || options.includeSummary) {
        const mdContent = generateMarkdownContent(meeting, options)
        zip.file(`${filename}.md`, mdContent)
    }

    // Add JSON data
    const jsonContent = generateJSONContent(meeting, options)
    zip.file('data.json', jsonContent)

    // Add audio if requested
    if (options.includeAudio && meeting.audio_url) {
        try {
            const audioResponse = await fetch(meeting.audio_url)
            const audioBlob = await audioResponse.blob()
            zip.file(`${filename}.mp3`, audioBlob)
        } catch (error) {
            console.error('Failed to download audio:', error)
        }
    }

    // Add README
    const readme = `Meeting Export: ${meeting.title}
Generated: ${new Date().toISOString()}

This package contains:
- ${filename}.md - Full transcript and summary in markdown
- data.json - Structured data for programmatic access
${options.includeAudio ? `- ${filename}.mp3 - Original audio recording\n` : ''}

Open the markdown file for easy reading!
`
    zip.file('README.txt', readme)

    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `${filename}_export.zip`)
}

// Helper functions
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .substring(0, 50) // Limit length
        .toLowerCase()
}

function formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`
}

function pad(num: number, size: number = 2): string {
    return num.toString().padStart(size, '0')
}

function generateMarkdownContent(meeting: Meeting, options: ExportOptions): string {
    let content = `# ${meeting.title}\n\n`
    content += `**Date**: ${new Date(meeting.created_at).toLocaleString()}\n\n`

    if (options.includeSummary && meeting.summary) {
        content += `## Summary\n\n${meeting.summary}\n\n`
    }

    if (options.includeKeyTopics && meeting.key_topics?.length) {
        content += `## Key Topics\n\n${meeting.key_topics.map(t => `- ${t}`).join('\n')}\n\n`
    }

    if (options.includeActionItems && meeting.action_items?.length) {
        content += `## Action Items\n\n${meeting.action_items.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n`
    }

    if (options.includeTranscript && meeting.transcript) {
        content += `## Transcript\n\n${meeting.transcript}\n`
    }

    return content
}

function generateJSONContent(meeting: Meeting, options: ExportOptions): string {
    const data: any = { title: meeting.title, date: meeting.created_at }
    if (options.includeTranscript && meeting.transcript) data.transcript = meeting.transcript
    if (options.includeSummary && meeting.summary) data.summary = meeting.summary
    if (options.includeActionItems && meeting.action_items) data.actionItems = meeting.action_items
    if (options.includeKeyTopics && meeting.key_topics) data.keyTopics = meeting.key_topics
    return JSON.stringify(data, null, 2)
}
