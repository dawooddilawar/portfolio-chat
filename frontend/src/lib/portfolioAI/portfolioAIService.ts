// src/lib/portfolioAI/portfolioAIService.ts

import { LLMProvider } from '@/lib/llm/types';
import { PortfolioRAGService } from '@/lib/llm/ragService';
import { PORTFOLIO_AI_CONFIG, QueryCategory, QUERY_CATEGORIES } from '@/config/portfolioAI';
import { SYSTEM_PROMPTS, ERROR_RESPONSES, buildPromptWithContext } from '@/config/prompts';
import { LLMProviderError } from '../llm/errors';

interface PortfolioAIResponse {
    content: string;
    category?: QueryCategory;
    confidence?: number;
}

interface QueryContext {
    category?: QueryCategory;
    previousContext?: string;
    metadata?: Record<string, unknown>;
}

export class PortfolioAIService {
    private llmProvider: LLMProvider;
    private ragService: PortfolioRAGService;
    private cache: Map<string, { response: PortfolioAIResponse; timestamp: number }>;

    constructor(llmProvider: LLMProvider, ragService: PortfolioRAGService) {
        this.llmProvider = llmProvider;
        this.ragService = ragService;
        this.cache = new Map();
    }

    async processQuery(
        query: string,
        context?: QueryContext
    ): Promise<PortfolioAIResponse> {
        try {
            // Check cache
            const cachedResponse = this.getCachedResponse(query);
            if (cachedResponse) {
                return cachedResponse;
            }

            // Determine query category
            const category = context?.category || await this.determineQueryCategory(query);

            // Get relevant documents
            const relevantDocs = await this.ragService.search(
                query,
                PORTFOLIO_AI_CONFIG.rag.maxResults
            );

            // Check if we have relevant context
            if (relevantDocs.length === 0) {
                return {
                    content: ERROR_RESPONSES.NO_CONTEXT,
                    category,
                    confidence: 0,
                };
            }

            // Build context from relevant documents
            const contextText = this.buildContext(relevantDocs);

            // Select appropriate prompt template
            const promptTemplate = this.getPromptTemplate(category);

            // Generate response
            const prompt = buildPromptWithContext(promptTemplate, contextText, query);
            const response = await this.llmProvider.generateResponse(prompt);

            const portfolioResponse: PortfolioAIResponse = {
                content: response.content,
                category,
                confidence: this.calculateConfidence(relevantDocs),
            };

            // Cache the response
            this.cacheResponse(query, portfolioResponse);

            return portfolioResponse;
        } catch (error) {
            if (error instanceof LLMProviderError) {
                return {
                    content: ERROR_RESPONSES.GENERAL_ERROR,
                    confidence: 0,
                };
            }
            throw error;
        }
    }

    private async determineQueryCategory(query: string): Promise<QueryCategory> {
        // Simple keyword-based categorization
        const queryLower = query.toLowerCase();

        if (queryLower.includes('project') || queryLower.includes('build') || queryLower.includes('create')) {
            return QUERY_CATEGORIES.PROJECTS;
        }
        if (queryLower.includes('experience') || queryLower.includes('work') || queryLower.includes('job')) {
            return QUERY_CATEGORIES.EXPERIENCE;
        }
        if (queryLower.includes('skill') || queryLower.includes('technology') || queryLower.includes('tech')) {
            return QUERY_CATEGORIES.SKILLS;
        }

        return QUERY_CATEGORIES.GENERAL;
    }

    private getPromptTemplate(category: QueryCategory): string {
        switch (category) {
            case QUERY_CATEGORIES.EXPERIENCE:
                return SYSTEM_PROMPTS.EXPERIENCE_QUERY;
            case QUERY_CATEGORIES.PROJECTS:
                return SYSTEM_PROMPTS.PROJECT_QUERY;
            default:
                return SYSTEM_PROMPTS.PORTFOLIO_CONTEXT;
        }
    }

    private buildContext(relevantDocs: any[]): string {
        return relevantDocs
            .map(doc => doc.document.content)
            .join('\n\n');
    }

    private calculateConfidence(relevantDocs: any[]): number {
        if (relevantDocs.length === 0) return 0;

        // Average the relevance scores
        const avgScore = relevantDocs.reduce(
            (sum, doc) => sum + doc.score,
            0
        ) / relevantDocs.length;

        return Math.min(avgScore, 1);
    }

    private getCachedResponse(query: string): PortfolioAIResponse | null {
        const cached = this.cache.get(query);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > PORTFOLIO_AI_CONFIG.cache.ttl * 1000) {
            this.cache.delete(query);
            return null;
        }

        return cached.response;
    }

    private cacheResponse(query: string, response: PortfolioAIResponse): void {
        // Maintain cache size limit
        if (this.cache.size >= PORTFOLIO_AI_CONFIG.cache.maxSize) {
            const oldestKey = Array.from(this.cache.keys())[0];
            this.cache.delete(oldestKey);
        }

        this.cache.set(query, {
            response,
            timestamp: Date.now(),
        });
    }
}