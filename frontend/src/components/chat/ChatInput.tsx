'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';

interface ChatInputProps {
    onInputStarted?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onInputStarted }) => {
    const [input, setInput] = useState('');
    const { sendMessage, isLoading, error } = useChat();
    
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || isLoading) {
            return;
        }

        if (onInputStarted) {
            onInputStarted();
        }
        
        try {
            setInput('');
            const response = await sendMessage(input);
        } catch (err) {
            console.error('Error in handleSubmit:', err);
        }
    }, [input, isLoading, sendMessage, onInputStarted]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    return (
        <>
        <form onSubmit={handleSubmit} className="flex gap-2 pixel-corners" data-testid="chat-form">
            <input
                type="text"
                value={input}
                onChange={handleInputChange}
                maxLength={250}
                placeholder={error || (isLoading ? "Processing..." : "Ask something about me or type a command (e.g., /help)")}
                disabled={isLoading}
                className="chat-input disabled:cursor-not-allowed"
                aria-label="Chat input"
                data-testid="chat-input"
            />
        </form>
        <div className="chat-input-footer">
            🤖 This AI chat has access to my actual experience but might occasionally get creative. 
            It's meant to be a fun, interactive way to explore my work! 
            For the full story, check my <a href="https://github.com/dawooddilawar">Github</a> or drop me a line at <a href="mailto:dawooddilawar94@gmail.com">dawooddilawar94@gmail.com</a>
        </div>
        </>
    );
};