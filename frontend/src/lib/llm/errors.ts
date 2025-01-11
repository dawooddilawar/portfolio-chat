// src/lib/llm/errors.ts

import { LLMError } from '@/lib/llm/types';

export class LLMProviderError extends Error implements LLMError {
    code: string;
    status?: number;

    constructor(message: string, code: string, status?: number) {
        super(message);
        this.name = 'LLMProviderError';
        this.code = code;
        this.status = status;
    }
}

export const ErrorCodes = {
    INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
    API_ERROR: 'API_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    CONTEXT_LENGTH_EXCEEDED: 'CONTEXT_LENGTH_EXCEEDED',
    INVALID_API_KEY: 'INVALID_API_KEY',
} as const;

export function isRetryableError(error: LLMError): boolean {
    return [
        ErrorCodes.API_ERROR,
        ErrorCodes.RATE_LIMIT_EXCEEDED,
    ].includes(error.code as (typeof ErrorCodes)[keyof typeof ErrorCodes]);
}