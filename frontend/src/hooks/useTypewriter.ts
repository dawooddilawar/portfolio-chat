import { useState, useEffect, useRef } from 'react';

interface UseTypewriterResult {
    displayText: string;
    isTyping: boolean;
}

export const useTypewriter = (text: string, speed = 30): UseTypewriterResult => {
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const textRef = useRef(text);
    const speedRef = useRef(speed);

    useEffect(() => {
        textRef.current = text;
        speedRef.current = speed;
        setDisplayText('');
        setIsTyping(true);

        const characters = text.split('');
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex < characters.length) {
                setDisplayText(prev => prev + characters[currentIndex]);
                currentIndex++;
            } else {
                setIsTyping(false);
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    return { displayText, isTyping };
};