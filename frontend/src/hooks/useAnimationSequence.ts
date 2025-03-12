// src/hooks/useAnimationSequence.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '@/config/messages';
import { useAnimationStore } from '@/store/animationStore';

export const useAnimationSequence = (phases: Message[][]) => {
    const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const currentPhaseRef = useRef(0);
    const isAnimatingRef = useRef(false);
    const timeoutsRef = useRef<number[]>([]);
    const { skipAnimation, setSkipAnimation } = useAnimationStore();

    // Function to clear all pending timeouts
    const clearAllTimeouts = useCallback(() => {
        timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        timeoutsRef.current = [];
    }, []);

    // Function to skip all animations and show all messages
    const skipAllAnimations = useCallback(() => {
        // Clear all pending timeouts
        clearAllTimeouts();
        
        // Flatten all phases into a single array of messages
        const allMessages = phases.flat();
        setVisibleMessages(allMessages);
        setIsTyping(false);
        
        // Set current phase to the end to prevent further animations
        currentPhaseRef.current = phases.length;
        isAnimatingRef.current = false;
        
        // Update the global state
        setSkipAnimation(true);
    }, [phases, clearAllTimeouts, setSkipAnimation]);

    // Check if animation should be skipped (from store)
    useEffect(() => {
        if (skipAnimation) {
            skipAllAnimations();
        }
    }, [skipAnimation, skipAllAnimations]);

    // Create a timeout that can be tracked and cleared
    const createTrackedTimeout = useCallback((callback: () => void, delay: number) => {
        const timeoutId = window.setTimeout(() => {
            // Remove this timeout from the tracking array when it completes
            timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId);
            callback();
        }, delay);
        
        // Add this timeout to the tracking array
        timeoutsRef.current.push(timeoutId);
        
        return timeoutId;
    }, []);

    const playNextPhase = useCallback(async () => {
        if (isAnimatingRef.current || currentPhaseRef.current >= phases.length) {
            return;
        }

        isAnimatingRef.current = true;
        const currentPhase = phases[currentPhaseRef.current];

        // If skip is already active, show all messages immediately
        if (skipAnimation) {
            skipAllAnimations();
            return;
        }

        if (currentPhaseRef.current === 0) {
            // First phase: show messages with 0.5s delay
            setVisibleMessages(prev => [...prev, currentPhase[0]]);
            
            createTrackedTimeout(() => {
                setVisibleMessages(prev => [...prev, currentPhase[1]]);
                
                createTrackedTimeout(() => {
                    // Move to next phase after delay
                    currentPhaseRef.current++;
                    isAnimatingRef.current = false;
                    
                    if (currentPhaseRef.current < phases.length) {
                        playNextPhase();
                    }
                }, 5000);
            }, 500);
        } else {
            // Other phases
            setIsTyping(true);
            
            createTrackedTimeout(() => {
                setIsTyping(false);
                
                // Add each message with a delay
                let messageIndex = 0;
                
                const addNextMessage = () => {
                    if (messageIndex < currentPhase.length) {
                        setVisibleMessages(prev => [...prev, currentPhase[messageIndex]]);
                        messageIndex++;
                        
                        if (messageIndex < currentPhase.length) {
                            createTrackedTimeout(addNextMessage, 500);
                        } else {
                            // All messages in this phase added, move to next phase
                            createTrackedTimeout(() => {
                                currentPhaseRef.current++;
                                isAnimatingRef.current = false;
                                
                                if (currentPhaseRef.current < phases.length) {
                                    playNextPhase();
                                }
                            }, 500);
                        }
                    }
                };
                
                // Start adding messages
                addNextMessage();
            }, 5000);
        }
    }, [phases, skipAnimation, skipAllAnimations, createTrackedTimeout]);

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

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            clearAllTimeouts();
        };
    }, [clearAllTimeouts]);

    return {
        visibleMessages,
        isTyping,
        startAnimation,
        skipAllAnimations,
        hasStartedAnimation: visibleMessages.length > 0,
        hasFinishedAnimation: currentPhaseRef.current >= phases.length
    };
};