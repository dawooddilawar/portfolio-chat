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
    const isMountedRef = useRef(true); // Track if component is mounted
    const { skipAnimation, setSkipAnimation } = useAnimationStore();

    // Set up mount/unmount tracking
    useEffect(() => {
        console.log('useAnimationSequence hook initialized');
        isMountedRef.current = true;
        
        return () => {
            console.log('useAnimationSequence hook cleanup');
            isMountedRef.current = false;
        };
    }, []);

    // Function to clear all pending timeouts
    const clearAllTimeouts = useCallback(() => {
        console.log(`Clearing ${timeoutsRef.current.length} timeouts`);
        timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        timeoutsRef.current = [];
    }, []);

    // Safe state update functions that check if component is mounted
    const safeSetVisibleMessages = useCallback((updater: React.SetStateAction<Message[]>) => {
        if (isMountedRef.current) {
            setVisibleMessages(updater);
        } else {
            console.warn('Attempted to update visibleMessages after unmount');
        }
    }, []);

    const safeSetIsTyping = useCallback((value: boolean) => {
        if (isMountedRef.current) {
            setIsTyping(value);
        } else {
            console.warn('Attempted to update isTyping after unmount');
        }
    }, []);

    // Function to skip all animations and show all messages
    const skipAllAnimations = useCallback(() => {
        console.log('skipAllAnimations called');
        
        // Clear all pending timeouts
        clearAllTimeouts();
        
        // Flatten all phases into a single array of messages
        const allMessages = phases.flat();
        safeSetVisibleMessages(allMessages);
        safeSetIsTyping(false);
        
        // Set current phase to the end to prevent further animations
        currentPhaseRef.current = phases.length;
        isAnimatingRef.current = false;
        
        // Update the global state
        setSkipAnimation(true);
        
        console.log('Animation skipped, all messages shown');
    }, [phases, clearAllTimeouts, setSkipAnimation, safeSetVisibleMessages, safeSetIsTyping]);

    // Check if animation should be skipped (from store)
    useEffect(() => {
        if (skipAnimation) {
            console.log('Skip animation detected from store, calling skipAllAnimations');
            skipAllAnimations();
        }
    }, [skipAnimation, skipAllAnimations]);

    // Create a timeout that can be tracked and cleared
    const createTrackedTimeout = useCallback((callback: () => void, delay: number) => {
        // Don't create new timeouts if component is unmounting
        if (!isMountedRef.current) {
            console.warn('Attempted to create timeout after unmount');
            return -1;
        }
        
        const timeoutId = window.setTimeout(() => {
            // Remove this timeout from the tracking array when it completes
            timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId);
            
            // Only execute callback if component is still mounted
            if (isMountedRef.current) {
                callback();
            } else {
                console.warn('Timeout callback prevented after unmount');
            }
        }, delay);
        
        // Add this timeout to the tracking array
        timeoutsRef.current.push(timeoutId);
        console.log(`Created timeout ${timeoutId}, total active: ${timeoutsRef.current.length}`);
        
        return timeoutId;
    }, []);

    const playNextPhase = useCallback(async () => {
        if (isAnimatingRef.current || currentPhaseRef.current >= phases.length) {
            console.log('playNextPhase: Already animating or all phases complete');
            return;
        }

        console.log(`Starting phase ${currentPhaseRef.current + 1} of ${phases.length}`);
        isAnimatingRef.current = true;
        const currentPhase = phases[currentPhaseRef.current];

        // If skip is already active, show all messages immediately
        if (skipAnimation) {
            console.log('Skip detected during playNextPhase');
            skipAllAnimations();
            return;
        }

        if (currentPhaseRef.current === 0) {
            // First phase: show messages with 0.5s delay
            console.log('Playing first phase');
            safeSetVisibleMessages(prev => [...prev, currentPhase[0]]);
            
            createTrackedTimeout(() => {
                console.log('Adding second message of first phase');
                safeSetVisibleMessages(prev => [...prev, currentPhase[1]]);
                
                createTrackedTimeout(() => {
                    // Move to next phase after delay
                    console.log('First phase complete');
                    currentPhaseRef.current++;
                    isAnimatingRef.current = false;
                    
                    if (currentPhaseRef.current < phases.length) {
                        playNextPhase();
                    }
                }, 5000);
            }, 500);
        } else {
            // Other phases
            console.log(`Playing phase ${currentPhaseRef.current + 1}`);
            safeSetIsTyping(true);
            
            createTrackedTimeout(() => {
                safeSetIsTyping(false);
                
                // Add each message with a delay
                let messageIndex = 0;
                
                const addNextMessage = () => {
                    if (messageIndex < currentPhase.length) {
                        console.log(`Adding message ${messageIndex + 1} of phase ${currentPhaseRef.current + 1}`);
                        safeSetVisibleMessages(prev => [...prev, currentPhase[messageIndex]]);
                        messageIndex++;
                        
                        if (messageIndex < currentPhase.length) {
                            createTrackedTimeout(addNextMessage, 500);
                        } else {
                            // All messages in this phase added, move to next phase
                            createTrackedTimeout(() => {
                                console.log(`Phase ${currentPhaseRef.current + 1} complete`);
                                currentPhaseRef.current++;
                                isAnimatingRef.current = false;
                                
                                if (currentPhaseRef.current < phases.length) {
                                    playNextPhase();
                                } else {
                                    console.log('All phases complete');
                                }
                            }, 500);
                        }
                    }
                };
                
                // Start adding messages
                addNextMessage();
            }, 5000);
        }
    }, [phases, skipAnimation, skipAllAnimations, createTrackedTimeout, safeSetVisibleMessages, safeSetIsTyping]);

    const startAnimation = useCallback(() => {
        if (currentPhaseRef.current === 0 && !isAnimatingRef.current) {
            console.log('Starting animation sequence');
            // If skip is already active, show all messages immediately
            if (skipAnimation) {
                console.log('Skip active at animation start');
                skipAllAnimations();
            } else {
                playNextPhase();
            }
        } else {
            console.log('Animation already started or in progress');
        }
    }, [playNextPhase, skipAnimation, skipAllAnimations]);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            console.log('Cleaning up timeouts on unmount');
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