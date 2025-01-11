// src/lib/portfolioAI/config.ts

import { env } from '@/config/env';
import { LLMConfig } from '@/lib/llm/types';
import { logger } from '@/utils/logger';

export function loadPortfolioAIConfig(): LLMConfig {
    logger.debug('Loading PortfolioAI configuration');

    const config: LLMConfig = {
        apiKey: env.OPENAI_API_KEY,
        model: env.LLM_MODEL,
        temperature: env.LLM_TEMPERATURE,
        maxTokens: env.LLM_MAX_TOKENS,
        baseUrl: env.OPENAI_API_URL,
    };

    // Validate configuration
    if (!config.apiKey) {
        logger.error('Missing OpenAI API key');
        throw new Error('Missing OpenAI API key');
    }

    logger.debug('PortfolioAI configuration loaded', {
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
    });

    return config;
}