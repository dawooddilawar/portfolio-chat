// src/lib/llm/openAIService.ts

import OpenAI from 'openai';
import { BaseLLMService } from '@/lib/llm/baseLLMService';
import { LLMConfig, LLMResponse } from '@/lib/llm/types';
import { LLMProviderError, ErrorCodes } from '@/lib/llm/errors';

export class OpenAIService extends BaseLLMService {
    private client: OpenAI | null = null;

    async initialize(config: LLMConfig): Promise<void> {
        try {
            this.client = new OpenAI({
                apiKey: config.apiKey,
                baseURL: config.baseUrl,
            });
            this.config = config;
        } catch (error) {
            throw new LLMProviderError(
                'Failed to initialize OpenAI client',
                ErrorCodes.INITIALIZATION_FAILED
            );
        }
    }

    protected async generateCompletion(prompt: string): Promise<LLMResponse> {
        if (!this.client || !this.config) {
            throw new LLMProviderError(
                'OpenAI client not initialized',
                ErrorCodes.INITIALIZATION_FAILED
            );
        }

        try {
            const response = await this.client.chat.completions.create({
                model: this.config.model || 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: this.config.temperature ?? 0.7,
                max_tokens: this.config.maxTokens ?? 150,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new LLMProviderError(
                    'No content in response',
                    ErrorCodes.API_ERROR
                );
            }

            return {
                content,
                metadata: {
                    tokens: response.usage?.total_tokens,
                    model: response.model,
                },
            };
        } catch (error: any) {
            if (error?.status === 429) {
                throw new LLMProviderError(
                    'Rate limit exceeded',
                    ErrorCodes.RATE_LIMIT_EXCEEDED,
                    429
                );
            }
            throw new LLMProviderError(
                error.message || 'OpenAI API error',
                ErrorCodes.API_ERROR,
                error?.status
            );
        }
    }
}