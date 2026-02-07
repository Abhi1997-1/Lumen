export interface AIService {
    process(filePath: string, meetingId: string): Promise<void>
    ask(context: string, question: string): Promise<string>
}
