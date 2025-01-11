// src/components/ui/TerminalFrame.tsx

import React, { forwardRef } from 'react';
import '@/styles/animations/keyframes.css';
import '@/styles/effects/terminal.css';

interface TerminalFrameProps {
    children: React.ReactNode;
    className?: string;
    enableGlow?: boolean;
    enableScanlines?: boolean;
    enablePixelation?: boolean;
    glowColor?: string;
    borderColor?: string;
}

export const TerminalFrame = forwardRef<HTMLDivElement, TerminalFrameProps>(
    (
        {
            children,
            className = '',
            enableGlow = true,
            enableScanlines = true,
            enablePixelation = true,
            glowColor,
            borderColor,
        },
        ref
    ) => {
        const frameStyle = {
            '--terminal-glow': glowColor,
            '--terminal-border': borderColor,
        } as React.CSSProperties;

        return (
            <div
                ref={ref}
                className={`terminal-frame ${className}`}
                style={frameStyle}
            >
                {enableScanlines && <div className="scanline" />}
                {enablePixelation && <div className="pixelated-border" />}
                {enableGlow && <div className="terminal-border" />}
                {children}
            </div>
        );
    }
);

TerminalFrame.displayName = 'TerminalFrame';