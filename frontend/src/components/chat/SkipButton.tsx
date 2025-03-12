import React from 'react';
import { useAnimationStore } from '@/store/animationStore';

interface SkipButtonProps {
    className?: string;
    onSkip: () => void;
}

export const SkipButton: React.FC<SkipButtonProps> = ({ className = '', onSkip }) => {
    const { skipAnimation } = useAnimationStore();

    // Don't render if already skipped
    if (skipAnimation) {
        return null;
    }

    const handleSkip = () => {
        onSkip();
    };

    return (
        <button
            onClick={handleSkip}
            className={`
                pixel-corners
                text-xs
                text-[color:var(--primary)]
                border-[color:var(--primary)]
                hover:opacity-80
                transition-opacity
                px-3
                py-1.5
                ${className}
            `}
            aria-label="Skip animation"
        >
            Skip →
        </button>
    );
}; 