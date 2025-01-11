// src/hooks/useMessageAnimation.ts

import { useState, useEffect, useCallback } from 'react';

interface UseMessageAnimationProps {
    content: string;
    typingSpeed?: number;
    startDelay?: number;
}

interface UseMessageAnimationReturn {
    displayText: string;
    isTyping: boolean;
    isDone: boolean;
    progress: number;
}

export const useMessageAnimation = ({
                                        content,
                                        typingSpeed = 30,
                                        startDelay = 0,
                                    }: UseMessageAnimationProps): UseMessageAnimationReturn => {
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [progress, setProgress] = useState(0);

    const animate = useCallback(() => {
        let currentIndex = 0;
        setIsTyping(true);
        setIsDone(false);

        const typeChar = () => {
            if (currentIndex < content.length) {
                setDisplayText(prev => prev + content[currentIndex]);
                setProgress((currentIndex + 1) / content.length);
                currentIndex++;
                setTimeout(typeChar, typingSpeed);
            } else {
                setIsTyping(false);
                setIsDone(true);
            }
        };

        setTimeout(typeChar, startDelay);
    }, [content, typingSpeed, startDelay]);

    useEffect(() => {
        setDisplayText('');
        setProgress(0);
        animate();

        return () => {
            setIsTyping(false);
            setIsDone(false);
        };
    }, [animate]);

    return {
        displayText,
        isTyping,
        isDone,
        progress,
    };
};