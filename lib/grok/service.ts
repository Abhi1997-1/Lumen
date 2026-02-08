import { createAdminClient } from '@/lib/supabase/server'
import { decryptText } from '@/lib/encryption'
import { checkRateLimit, trackAPIUsage } from '@/lib/rate-limit/middleware'

export async function processMeetingWithGrok(
    userId: string,
    storagePath: string,
    modelName: string = 'grok-2-latest'
) {
    console.log("🚀 START: processMeetingWithGrok", { userId, storagePath, modelName })

    try {
        // 0. CHECK RATE LIMIT
        const rateLimitCheck = await checkRateLimit(userId, 'groq')

        if (!rateLimitCheck.allowed) {
            console.error("❌ Rate limit exceeded", rateLimitCheck)
            await trackAPIUsage(userId, 'groq', {
                endpoint: 'processMeeting',
                success: false,
                errorCode: 'RATE_LIMIT_EXCEEDED',
                errorMessage: rateLimitCheck.errorMessage
            })

            return {
                success: false,
                error: rateLimitCheck.errorMessage,
                upgradePrompt: rateLimitCheck.upgradePrompt,
                resetAt: rateLimitCheck.resetAt.toISOString()
            }
        }

        // 1. Get User API Key
        const supabase = await createAdminClient()
        const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('groq_api_key')
            .eq('user_id', userId)
            .single()

        if (settingsError || !settings?.groq_api_key) {
            return { success: false, error: 'Groq API key not configured' }
        }

        const apiKey = await decryptText(settings.groq_api_key)

        // 2. Get audio file from storage
        const { data: audioFile, error: downloadError } = await supabase.storage
            .from('audio-files')
            .download(storagePath)

        if (downloadError || !audioFile) {
            return { success: false, error: 'Failed to download audio file' }
        }

        // 3. Convert blob to base64
        const arrayBuffer = await audioFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Audio = buffer.toString('base64')

        // 4. Call Grok API
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional meeting transcription assistant. Analyze audio and provide: 1) Verbatim transcript with speaker labels. 2) Executive summary. 3) Action items. Return valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: `Transcribe this audio file (base64): ${base64Audio.substring(0, 100)}...`
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('Grok API error:', error)

            await trackAPIUsage(userId, 'groq', {
                endpoint: 'processMeeting',
                success: false,
                errorCode: response.status.toString(),
                errorMessage: error
            })

            return { success: false, error: `Grok API error: ${error}` }
        }

        const result = await response.json()
        const content = JSON.parse(result.choices[0].message.content)

        // Track successful usage
        await trackAPIUsage(userId, 'groq', {
            endpoint: 'processMeeting',
            tokensUsed: result.usage?.total_tokens || 0,
            success: true
        })

        return {
            success: true,
            transcript: content.transcript || '',
            summary: content.summary || '',
            action_items: content.action_items || [],
            key_topics: content.key_topics || [],
            sentiment: content.sentiment || 'neutral',
            usage: {
                input_tokens: result.usage?.prompt_tokens || 0,
                output_tokens: result.usage?.completion_tokens || 0,
                total_tokens: result.usage?.total_tokens || 0
            }
        }
    } catch (error: any) {
        console.error('Grok processing error:', error)

        await trackAPIUsage(userId, 'groq', {
            endpoint: 'processMeeting',
            success: false,
            errorCode: 'PROCESSING_ERROR',
            errorMessage: error.message
        })

        return { success: false, error: error.message }
    }
}
