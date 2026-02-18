import { GroqService } from './groq';

export class AIFactory {
    static getService(userId: string): GroqService {
        // Always return GroqService.
        // GroqService handles its own key retrieval (user key or system key).
        return new GroqService(userId);
    }
}
