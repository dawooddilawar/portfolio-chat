// src/hooks/useAnimationSequence.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '@/config/messages';

export const useAnimationSequence = (phases: Message[][]) => {
    const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const currentPhaseRef = useRef(0);
    const isAnimatingRef = useRef(false);

    const playNextPhase = useCallback(async () => {
        if (isAnimatingRef.current || currentPhaseRef.current >= phases.length) {
            return;
        }

        isAnimatingRef.current = true;
        const currentPhase = phases[currentPhaseRef.current];

        if (currentPhaseRef.current === 0) {
            // First phase: show messages with 0.5s delay
            setVisibleMessages(prev => [...prev, currentPhase[0]]);
            await new Promise(resolve => setTimeout(resolve, 500));
            setVisibleMessages(prev => [...prev, currentPhase[1]]);
            await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
            // Other phases
            setIsTyping(true);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsTyping(false);

            for (const message of currentPhase) {
                setVisibleMessages(prev => [...prev, message]);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        currentPhaseRef.current++;
        isAnimatingRef.current = false;

        if (currentPhaseRef.current < phases.length) {
            playNextPhase();
        }
    }, [phases]);

    const startAnimation = useCallback(() => {
        if (currentPhaseRef.current === 0 && !isAnimatingRef.current) {
            playNextPhase();
        }
    }, [playNextPhase]);

    return {
        visibleMessages,
        isTyping,
        startAnimation,
    };
};