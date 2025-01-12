import { useState, useCallback } from 'react';
import { ChatApi } from '@/services/api/chatApi';
import { useChatStore } from '@/store/chatStore';
import { Message } from '@/config/messages';

const chatApi = new ChatApi();

export const useChat = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addMessage } = useChatStore();


    const sendMessage = useCallback(async (content: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // Create user message
            const userMessage: Message = {
                id: `user-${Date.now()}`,
                content,
                type: 'user',
                isLastInGroup: true,
                groupId: Date.now(),
                width: 'auto',
            };

            addMessage(userMessage);

            // Send to API and get response
            const response = await chatApi.sendMessage(content);

            // Add assistant message
            addMessage(response);

            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [addMessage]);

    return {
        sendMessage,
        isLoading,
        error
    };
};