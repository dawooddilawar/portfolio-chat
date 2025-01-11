// src/lib/llm/types.ts

export interface LLMResponse {
    content: string;
    metadata?: {
        tokens?: number;
        model?: string;
    };
}

export interface LLMError extends Error {
    code: string;
    status?: number;
}

export interface LLMConfig {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    baseUrl?: string;
}

export interface LLMProvider {
    generateResponse: (prompt: string) => Promise<LLMResponse>;
    initialize: (config: LLMConfig) => Promise<void>;
}

export interface RAGDocument {
    id: string;
    content: string;
    metadata?: Record<string, unknown>;
}

export interface VectorSearchResult {
    document: RAGDocument;
    score: number;
}

export interface RAGService {
    addDocuments: (documents: RAGDocument[]) => Promise<void>;
    search: (query: string, limit?: number) => Promise<VectorSearchResult[]>;
}