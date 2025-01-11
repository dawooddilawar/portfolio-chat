// src/lib/llm/baseLLMService.ts

import { LLMConfig, LLMProvider, LLMResponse } from '@/lib/llm/types';
import { isRetryableError, LLMProviderError, ErrorCodes } from '@/lib/llm/errors';

export abstract class BaseLLMService implements LLMProvider {
    protected config: LLMConfig | null = null;
    private maxRetries = 3;
    private baseDelay = 1000; // 1 second

    abstract initialize(config: LLMConfig): Promise<void>;
    protected abstract generateCompletion(prompt: string): Promise<LLMResponse>;

    async generateResponse(prompt: string): Promise<LLMResponse> {
        if (!this.config) {
            throw new LLMProviderError(
                'LLM service not initialized',
                ErrorCodes.INITIALIZATION_FAILED
            );
        }

        let lastError: Error | null = null;
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                return await this.generateCompletion(prompt);
            } catch (error) {
                lastError = error as Error;
                if (error instanceof LLMProviderError && !isRetryableError(error)) {
                    throw error;
                }

                if (attempt < this.maxRetries - 1) {
                    const delay = this.calculateBackoff(attempt);
                    await this.sleep(delay);
                    continue;
                }
            }
        }

        throw new LLMProviderError(
            `Failed after ${this.maxRetries} attempts: ${lastError?.message}`,
            ErrorCodes.API_ERROR
        );
    }

    private calculateBackoff(attempt: number): number {
        return Math.min(
            this.baseDelay * Math.pow(2, attempt), // exponential backoff
            10000 // max 10 seconds
        );
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}