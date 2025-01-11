// src/components/chat/TypingIndicator.tsx

import React from 'react';
import '@/styles/animations/chatAnimations.css';

export const TypingIndicator: React.FC = () => {
    return (
        <div className="typing-indicator bubble-enter">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
        </div>
    );
};