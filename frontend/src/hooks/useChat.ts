import { useState, useCallback, useEffect } from 'react';
import { ChatApi } from '@/services/api/chatApi';
import { useChatStore } from '@/store/chatStore';
import { ChatMessage } from '@/types/chat';
import { Message } from '@/config/messages';

const chatApi = new ChatApi();

export const useChat = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { messages, addMessage } = useChatStore();


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

            console.log('Adding user message to store:', userMessage);
            addMessage(userMessage);

            // Send to API and get response
            console.log('Sending message to API');
            const response = await chatApi.sendMessage(content);
            console.log('Received API response:', response);

            // Add assistant message
            addMessage(response);
            console.log('Added assistant message to store');

            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            console.error('Error in sendMessage:', err);
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