import React, { useEffect } from 'react';
import { useAnimationStore } from '@/store/animationStore';

interface SkipButtonProps {
    className?: string;
    onSkip: () => void;
}

export const SkipButton: React.FC<SkipButtonProps> = ({ className = '', onSkip }) => {
    const { skipAnimation } = useAnimationStore();

    // Add component lifecycle logging
    useEffect(() => {
        console.log('SkipButton mounted, skipAnimation:', skipAnimation);
        return () => {
            console.log('SkipButton unmounted');
        };
    }, [skipAnimation]);

    // Don't render if already skipped
    if (skipAnimation) {
        console.log('SkipButton not rendering due to skipAnimation being true');
        return null;
    }

    const handleSkip = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log('Skip button clicked, calling onSkip');
        
        // Use setTimeout to ensure the event completes before any potential unmounting
        setTimeout(() => {
            onSkip();
        }, 0);
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