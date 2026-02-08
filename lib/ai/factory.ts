import { AIService } from './service';
import { GeminiService } from './gemini';
import { GroqService } from './groq';
import { OpenAIService } from './openai';

export class AIFactory {
    static getService(provider: string, apiKey: string | null | undefined, userId: string): AIService {
        switch (provider) {
            case 'groq':
                // Groq service fetches key from database if not provided (like Gemini)
                return new GroqService(userId, apiKey || undefined);
            case 'openai':
                if (!apiKey) throw new Error("OpenAI API Key missing");
                return new OpenAIService(apiKey);
            case 'gemini':
            default:
                // Gemini is default, apiKey might be null (uses system env in service)
                // But GeminiService constructor takes userId, logic is internal
                return new GeminiService(userId);
        }
    }
}
