// src/lib/portfolioAI/portfolioAIFactory.ts

import { OpenAIService } from '@/lib/llm/openAIService';
import { PortfolioRAGService } from '@/lib/llm/ragService';
import { PortfolioAIService } from '@/lib/portfolioAI/portfolioAIService';
import { LLMConfig } from '@/lib/llm/types';

let instance: PortfolioAIService | null = null;

export async function createPortfolioAI(config: LLMConfig): Promise<PortfolioAIService> {
    if (instance) {
        return instance;
    }

    const llmService = new OpenAIService();
    await llmService.initialize(config);

    const ragService = new PortfolioRAGService(llmService);
    instance = new PortfolioAIService(llmService, ragService);

    return instance;
}

export function getPortfolioAI(): PortfolioAIService {
    if (!instance) {
        throw new Error('PortfolioAI not initialized. Call createPortfolioAI first.');
    }
    return instance;
}