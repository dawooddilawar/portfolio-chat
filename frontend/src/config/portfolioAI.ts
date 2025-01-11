// src/config/portfolioAI.ts

export const PORTFOLIO_AI_CONFIG = {
    llm: {
        maxTokens: 150,
        temperature: 0.7,
        topP: 1,
        presencePenalty: 0.5,
        frequencyPenalty: 0.5,
    },

    rag: {
        maxResults: 3,
        minRelevanceScore: 0.7,
        chunkSize: 500,
        chunkOverlap: 50,
    },

    retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
    },

    cache: {
        ttl: 3600, // 1 hour in seconds
        maxSize: 100, // maximum number of cached responses
    },
};

export const QUERY_CATEGORIES = {
    EXPERIENCE: 'experience',
    PROJECTS: 'projects',
    SKILLS: 'skills',
    GENERAL: 'general',
} as const;

export type QueryCategory = typeof QUERY_CATEGORIES[keyof typeof QUERY_CATEGORIES];