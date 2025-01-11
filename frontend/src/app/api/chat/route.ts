// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createPortfolioAI } from '@/lib/portfolioAI/portfolioAIFactory';
import { loadPortfolioAIConfig } from '@/lib/portfolioAI/config';
import { createChatService } from '@/lib/chat/chatService';
import { logger } from '@/utils/logger';

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();
        logger.debug('Received message:', { message });

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Initialize services
        logger.debug('Initializing services...');
        const config = loadPortfolioAIConfig();
        const portfolioAI = await createPortfolioAI(config);
        const chatService = createChatService(portfolioAI);

        // Process message
        logger.debug('Processing message...');
        const response = await chatService.processMessage(message);
        logger.debug('Response received:', { response });

        return NextResponse.json({ response });
    } catch (error: any) {
        logger.error('Chat API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process message',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}