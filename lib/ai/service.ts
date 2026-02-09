export interface AIService {
    transcribe(filePath: string): Promise<string>
    analyze(transcript: string, meetingId: string, model?: string): Promise<void>
    ask(context: string, question: string): Promise<string>
}
