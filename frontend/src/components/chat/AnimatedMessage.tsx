import React from 'react';
import { useTypewriter } from '@/hooks/useTypewriter';

interface AnimatedMessageProps {
    content: string;
    type: 'user' | 'assistant' | 'system';
    className?: string;
}

export const AnimatedMessage: React.FC<AnimatedMessageProps> = ({
                                                                    content,
                                                                    type,
                                                                    className = '',
                                                                }) => {
    const { displayText, isTyping } = useTypewriter(content);

    return (
        <div className={className}>
            {displayText}
            {isTyping && <span className="cursor">|</span>}
        </div>
    );
};