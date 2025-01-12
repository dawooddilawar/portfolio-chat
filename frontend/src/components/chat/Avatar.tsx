// src/components/chat/Avatar.tsx

import React from 'react';

interface AvatarProps {
    className?: string;
    type: 'user' | 'assistant' | 'system' | 'header';
}

// Images should be saved in frontend/public/images/
export const Avatar: React.FC<AvatarProps> = ({ className = '', type }) => {
    const imageSrc = type === 'assistant' ? '/images/assistant.png' : '/images/user.jpg';
    
    return (
        <div
            className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden avatar-border ${className}`}
            aria-hidden="true"
        >
            <img 
                src={imageSrc}
                alt={`${type} avatar`}
                className="w-full h-full object-cover"
            />
        </div>
    );
};