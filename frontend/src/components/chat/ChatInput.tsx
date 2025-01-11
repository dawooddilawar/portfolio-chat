'use client';

import React, { useState, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';

export const ChatInput: React.FC = () => {
    const [input, setInput] = useState('');
    const { sendMessage, isLoading, error } = useChat();

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || isLoading) {
            return;
        }

        try {
            const response = await sendMessage(input);
            setInput('');
        } catch (err) {
            console.error('Error in handleSubmit:', err);
        }
    }, [input, isLoading, sendMessage]);

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 pixel-corners" data-testid="chat-form">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={250}
                placeholder={error || (isLoading ? "Processing..." : "Type a message or command (e.g., /help)")}
                disabled={isLoading}
                className="chat-input disabled:cursor-not-allowed"
                aria-label="Chat input"
                data-testid="chat-input"
            />
        </form>
    );
};