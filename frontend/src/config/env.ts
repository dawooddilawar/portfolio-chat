// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
    OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
    OPENAI_API_URL: z.string().default("https://api.openai.com/v1"),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    APP_URL: z.string().default("http://localhost:3000"),

    // Feature flags
    ENABLE_STREAMING: z.string().transform(val => val === 'true').default('false'),
    ENABLE_DEBUG_LOGS: z.string().transform(val => val === 'true').default('true'),
    MAX_REQUESTS_PER_MINUTE: z.string().transform(Number).default('60'),

    // LLM Configuration
    LLM_MODEL: z.string().default('gpt-3.5-turbo'),
    LLM_TEMPERATURE: z.string().transform(Number).default('0.7'),
    LLM_MAX_TOKENS: z.string().transform(Number).default('150'),
});

try {
    envSchema.parse(process.env);

} catch (error) {
    if (error instanceof z.ZodError) {
        console.error('❌ Validation errors:');
        error.errors.forEach(err => {
            console.error(`- Path: ${err.path.join('.')}`);
            console.error(`  Message: ${err.message}`);
            console.error(`  Code: ${err.code}`);
        });
    } else {
        console.error('❌ Unknown error:', error);
    }
    process.exit(1);
}

export const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    OPENAI_API_URL: process.env.OPENAI_API_URL,
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
    APP_URL: process.env.APP_URL,

    // Feature flags
    ENABLE_STREAMING: process.env.ENABLE_STREAMING === 'true',
    ENABLE_DEBUG_LOGS: process.env.ENABLE_DEBUG_LOGS === 'true',
    MAX_REQUESTS_PER_MINUTE: Number(process.env.MAX_REQUESTS_PER_MINUTE),

    // LLM Configuration
    LLM_MODEL: process.env.LLM_MODEL,
    LLM_TEMPERATURE: Number(process.env.LLM_TEMPERATURE),
    LLM_MAX_TOKENS: Number(process.env.LLM_MAX_TOKENS),
} as const;