// src/hooks/useChat.ts

import { useState, useCallback } from 'react';

export const useChat = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processMessage = useCallback(async (message: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.details || 'Failed to process message');
            }

            const data = await response.json();
            if (!data.response) {
                throw new Error('No response received from server');
            }

            return data.response;
        } catch (err) {
            console.error('Chat error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to process message. Please try again.';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        processMessage,
        isLoading,
        error,
    };
};