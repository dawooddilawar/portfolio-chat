import React, { useEffect, useRef, useState } from 'react';
import { useAnimationStore } from '@/store/animationStore';

interface SkipButtonProps {
    className?: string;
    onSkip: () => void;
}

export const SkipButton: React.FC<SkipButtonProps> = ({ className = '', onSkip }) => {
    const { skipAnimation } = useAnimationStore();
    const isMountedRef = useRef(true);
    const isClickedRef = useRef(false);
    const [isDisabled, setIsDisabled] = useState(false);

    // Add component lifecycle logging and tracking
    useEffect(() => {
        console.log('SkipButton mounted, skipAnimation:', skipAnimation);
        isMountedRef.current = true;
        isClickedRef.current = false;
        
        return () => {
            console.log('SkipButton unmounted');
            isMountedRef.current = false;
        };
    }, [skipAnimation]);

    // Don't render if already skipped
    if (skipAnimation) {
        console.log('SkipButton not rendering due to skipAnimation being true');
        return null;
    }

    const handleSkip = (e: React.MouseEvent) => {
        e.preventDefault();
        
        // Don't proceed if component is unmounted
        if (!isMountedRef.current) {
            console.warn('Skip button clicked but component is unmounted');
            return;
        }
        
        // Prevent duplicate clicks
        if (isClickedRef.current || isDisabled) {
            console.log('Skip button already clicked, ignoring duplicate click');
            return;
        }
        
        console.log('Skip button clicked, calling onSkip');
        
        // Mark as clicked and disable the button
        isClickedRef.current = true;
        
        if (isMountedRef.current) {
            setIsDisabled(true);
        }
        
        try {
            // Only call onSkip if component is still mounted
            if (isMountedRef.current) {
                onSkip();
            }
        } catch (error) {
            console.error('Error in skip button click handler:', error);
        } finally {
            // Reset click state after a short delay
            setTimeout(() => {
                if (isMountedRef.current) {
                    isClickedRef.current = false;
                    setIsDisabled(false);
                }
            }, 300);
        }
    };

    return (
        <button
            onClick={handleSkip}
            disabled={isDisabled}
            className={`
                pixel-corners
                text-xs
                text-[color:var(--primary)]
                border-[color:var(--primary)]
                hover:opacity-80
                transition-opacity
                px-3
                py-1.5
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
            `}
            aria-label="Skip animation"
        >
            Skip →
        </button>
    );
}; 