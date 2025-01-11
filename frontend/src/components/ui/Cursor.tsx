// src/components/ui/Cursor.tsx

import React from 'react';
import '@/styles/animations/messageAnimations.css';

interface CursorProps {
    visible?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export const Cursor: React.FC<CursorProps> = ({
                                                  visible = true,
                                                  className = '',
                                                  style = {},
                                              }) => {
    if (!visible) return null;

    return (
        <span
            className={`cursor ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
};

interface ThinkingCursorProps {
    visible?: boolean;
    className?: string;
}

export const ThinkingCursor: React.FC<ThinkingCursorProps> = ({
                                                                  visible = true,
                                                                  className = '',
                                                              }) => {
    if (!visible) return null;

    return (
        <span
            className={`thinking ${className}`}
            aria-label="thinking"
        />
    );
};