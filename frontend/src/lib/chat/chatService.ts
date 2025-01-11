// src/lib/chat/chatApi.ts

import { commands } from '@/config/commands';
import { errorMessage } from '@/config/messages';
import { PortfolioAIService } from '@/lib/portfolioAI/portfolioAIService';
import { QUERY_CATEGORIES, QueryCategory } from '@/config/portfolioAI';

export class ChatService {
    private portfolioAI: PortfolioAIService;
    private conversationContext: {
        lastCategory?: QueryCategory;
        lastQuery?: string;
    } = {};

    constructor(portfolioAI: PortfolioAIService) {
        this.portfolioAI = portfolioAI;
    }

    async processMessage(message: string): Promise<string> {
        // Handle commands
        if (message.startsWith('/')) {
            return this.handleCommand(message);
        }

        try {
            // Process through PortfolioAI
            const response = await this.portfolioAI.processQuery(message, {
                category: this.conversationContext.lastCategory,
                previousContext: this.conversationContext.lastQuery,
            });

            // Update conversation context
            this.conversationContext = {
                lastCategory: response.category,
                lastQuery: message,
            };

            return response.content;
        } catch (error) {
            console.error('Error processing message:', error);
            return errorMessage.content;
        }
    }

    private async handleCommand(message: string): Promise<string> {
        const commandName = message.slice(1).split(' ')[0];
        const command = commands[commandName];

        if (!command) {
            return `Unknown command: ${commandName}. Type /help for available commands.`;
        }

        try {
            const response = await command.handler();

            // Update context for certain commands
            if (commandName === 'about') {
                this.conversationContext.lastCategory = QUERY_CATEGORIES.GENERAL;
            } else if (commandName === 'projects') {
                this.conversationContext.lastCategory = QUERY_CATEGORIES.PROJECTS;
            }

            return response;
        } catch (error) {
            console.error('Error executing command:', error);
            return `Error executing command: ${commandName}`;
        }
    }

    // Reset conversation context
    public resetContext(): void {
        this.conversationContext = {};
    }
}

// Factory function to create ChatService instance
export const createChatService = (
    portfolioAI: PortfolioAIService
) => new ChatService(portfolioAI);