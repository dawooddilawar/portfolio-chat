// src/hooks/useAnimationSequence.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '@/config/messages';
import { useAnimationStore } from '@/store/animationStore';

export const useAnimationSequence = (phases: Message[][]) => {
    const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const currentPhaseRef = useRef(0);
    const isAnimatingRef = useRef(false);
    const { skipAnimation } = useAnimationStore();

    // Function to skip all animations and show all messages
    const skipAllAnimations = useCallback(() => {
        // Flatten all phases into a single array of messages
        const allMessages = phases.flat();
        setVisibleMessages(allMessages);
        setIsTyping(false);
        
        // Set current phase to the end to prevent further animations
        currentPhaseRef.current = phases.length;
        isAnimatingRef.current = false;
    }, [phases]);

    // Check if animation should be skipped (from store)
    useEffect(() => {
        if (skipAnimation) {
            skipAllAnimations();
        }
    }, [skipAnimation, skipAllAnimations]);

    const playNextPhase = useCallback(async () => {
        if (isAnimatingRef.current || currentPhaseRef.current >= phases.length) {
            return;
        }

        isAnimatingRef.current = true;
        const currentPhase = phases[currentPhaseRef.current];

        // Check if we should skip animations
        if (skipAnimation) {
            skipAllAnimations();
            return;
        }

        if (currentPhaseRef.current === 0) {
            // First phase: show messages with 0.5s delay
            setVisibleMessages(prev => [...prev, currentPhase[0]]);
            
            // Check for skip after each step
            if (skipAnimation) { 
                skipAllAnimations();
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (skipAnimation) {
                skipAllAnimations();
                return;
            }
            
            setVisibleMessages(prev => [...prev, currentPhase[1]]);
            
            if (skipAnimation) {
                skipAllAnimations();
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
            // Other phases
            setIsTyping(true);
            
            if (skipAnimation) {
                skipAllAnimations();
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            if (skipAnimation) {
                skipAllAnimations();
                return;
            }
            
            setIsTyping(false);

            for (const message of currentPhase) {
                setVisibleMessages(prev => [...prev, message]);
                
                if (skipAnimation) {
                    skipAllAnimations();
                    return;
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (skipAnimation) {
                    skipAllAnimations();
                    return;
                }
            }
        }

        currentPhaseRef.current++;
        isAnimatingRef.current = false;

        if (currentPhaseRef.current < phases.length) {
            playNextPhase();
        }
    }, [phases, skipAnimation, skipAllAnimations]);

    const startAnimation = useCallback(() => {
        if (currentPhaseRef.current === 0 && !isAnimatingRef.current) {
            // If skip is already active, show all messages immediately
            if (skipAnimation) {
                skipAllAnimations();
            } else {
                playNextPhase();
            }
        }
    }, [playNextPhase, skipAnimation, skipAllAnimations]);

    return {
        visibleMessages,
        isTyping,
        startAnimation,
        skipAllAnimations
    };
};