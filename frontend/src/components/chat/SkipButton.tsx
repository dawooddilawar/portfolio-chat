import React from 'react';
import { useAnimationStore } from '@/store/animationStore';

interface SkipButtonProps {
    className?: string;
}

export const SkipButton: React.FC<SkipButtonProps> = ({ className = '' }) => {
    const { skipAnimation, setSkipAnimation } = useAnimationStore();

    // Don't render if already skipped
    if (skipAnimation) {
        return null;
    }

    const handleSkip = () => {
        setSkipAnimation(true);
    };

    return (
        <button
            onClick={handleSkip}
            className={`
                pixel-corners
                text-xs
                text-primary
                border-primary
                hover:opacity-80
                transition-opacity
                px-3
                py-1.5
                ${className}
            `}
        >
            Skip →
        </button>
    );
}; 