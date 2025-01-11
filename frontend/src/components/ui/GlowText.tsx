// src/components/ui/GlowText.tsx

import React, {JSX} from 'react';
import '@/styles/animations/keyframes.css';

interface GlowTextProps {
    children: React.ReactNode;
    color?: string;
    intensity?: 'low' | 'medium' | 'high';
    flicker?: boolean;
    className?: string;
    as?: keyof JSX.IntrinsicElements;
}

export const GlowText: React.FC<GlowTextProps> = ({
                                                      children,
                                                      color = '#4d9375',
                                                      intensity = 'medium',
                                                      flicker = false,
                                                      className = '',
                                                      as: Component = 'span',
                                                  }) => {
    const glowIntensity = {
        low: '2px',
        medium: '4px',
        high: '8px',
    };

    const style = {
        '--glow-color': color,
        '--glow-spread': glowIntensity[intensity],
        textShadow: `0 0 ${glowIntensity[intensity]} var(--glow-color)`,
    } as React.CSSProperties;

    return (
        <Component
            className={`${flicker ? 'animate-flicker' : ''} ${className}`}
            style={style}
        >
            {children}
        </Component>
    );
};