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
            
            // Ensure all timeouts are cleared on unmount
            if (timeoutsRef.current.length > 0) {
                clearAllTimeouts();
            }
        };
    }, []);

    // Function to clear all pending timeouts
    const clearAllTimeouts = useCallback(() => {
        console.log(`Clearing ${timeoutsRef.current.length} timeouts`);
        timeoutsRef.current.forEach(timeoutId => {
            try {
                clearTimeout(timeoutId);
            } catch (error) {
                console.error(`Error clearing timeout ${timeoutId}:`, error);
            }
        });
        timeoutsRef.current = [];
    }, []);

    // Safe state update functions that check if component is mounted
    const safeSetVisibleMessages = useCallback((updater: React.SetStateAction<Message[]>) => {
        if (isMountedRef.current) {
            try {
                setVisibleMessages(updater);
            } catch (error) {
                console.error('Error updating visibleMessages:', error);
            }
        } else {
            console.warn('Attempted to update visibleMessages after unmount');
        }
    }, []);

    const safeSetIsTyping = useCallback((value: boolean) => {
        if (isMountedRef.current) {
            try {
                setIsTyping(value);
            } catch (error) {
                console.error('Error updating isTyping:', error);
            }
        } else {
            console.warn('Attempted to update isTyping after unmount');
        }
    }, []);

    // Function to skip all animations and show all messages
    const skipAllAnimations = useCallback(() => {
        console.log('skipAllAnimations called');
        
        // Only proceed if component is still mounted
        if (!isMountedRef.current) {
            console.warn('skipAllAnimations called after unmount');
            return;
        }
        
        // Clear all pending timeouts
        clearAllTimeouts();
        
        try {
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
        } catch (error) {
            console.error('Error in skipAllAnimations:', error);
        }
    }, [phases, clearAllTimeouts, setSkipAnimation, safeSetVisibleMessages, safeSetIsTyping]);

    // Check if animation should be skipped (from store)
    useEffect(() => {
        if (skipAnimation && isMountedRef.current) {
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
        
        // Wrap callback in try-catch and mount check
        const safeCallback = () => {
            // Remove this timeout from the tracking array when it completes
            timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId);
            
            // Only execute callback if component is still mounted
            if (isMountedRef.current) {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in timeout callback:', error);
                }
            } else {
                console.warn('Timeout callback prevented after unmount');
            }
        };
        
        // Create the timeout with the safe callback
        const timeoutId = window.setTimeout(safeCallback, delay);
        
        // Add this timeout to the tracking array
        timeoutsRef.current.push(timeoutId);
        console.log(`Created timeout ${timeoutId}, total active: ${timeoutsRef.current.length}`);
        
        return timeoutId;
    }, []);

    const playNextPhase = useCallback(async () => {
        // Don't proceed if component is unmounted
        if (!isMountedRef.current) {
            console.warn('playNextPhase called after unmount');
            return;
        }
        
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

        try {
            if (currentPhaseRef.current === 0) {
                // First phase: show messages with 0.5s delay
                console.log('Playing first phase');
                safeSetVisibleMessages(prev => [...prev, currentPhase[0]]);
                
                createTrackedTimeout(() => {
                    // Check if component is still mounted before continuing
                    if (!isMountedRef.current) return;
                    
                    console.log('Adding second message of first phase');
                    safeSetVisibleMessages(prev => [...prev, currentPhase[1]]);
                    
                    createTrackedTimeout(() => {
                        // Check if component is still mounted before continuing
                        if (!isMountedRef.current) return;
                        
                        // Move to next phase after delay
                        console.log('First phase complete');
                        currentPhaseRef.current++;
                        isAnimatingRef.current = false;
                        
                        if (currentPhaseRef.current < phases.length && isMountedRef.current) {
                            playNextPhase();
                        }
                    }, 5000);
                }, 500);
            } else {
                // Other phases
                console.log(`Playing phase ${currentPhaseRef.current + 1}`);
                safeSetIsTyping(true);
                
                createTrackedTimeout(() => {
                    // Check if component is still mounted before continuing
                    if (!isMountedRef.current) return;
                    
                    safeSetIsTyping(false);
                    
                    // Add each message with a delay
                    let messageIndex = 0;
                    
                    const addNextMessage = () => {
                        // Check if component is still mounted before continuing
                        if (!isMountedRef.current) return;
                        
                        if (messageIndex < currentPhase.length) {
                            console.log(`Adding message ${messageIndex + 1} of phase ${currentPhaseRef.current + 1}`);
                            safeSetVisibleMessages(prev => [...prev, currentPhase[messageIndex]]);
                            messageIndex++;
                            
                            if (messageIndex < currentPhase.length && isMountedRef.current) {
                                createTrackedTimeout(addNextMessage, 500);
                            } else if (isMountedRef.current) {
                                // All messages in this phase added, move to next phase
                                createTrackedTimeout(() => {
                                    // Check if component is still mounted before continuing
                                    if (!isMountedRef.current) return;
                                    
                                    console.log(`Phase ${currentPhaseRef.current + 1} complete`);
                                    currentPhaseRef.current++;
                                    isAnimatingRef.current = false;
                                    
                                    if (currentPhaseRef.current < phases.length && isMountedRef.current) {
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
        } catch (error) {
            console.error('Error in playNextPhase:', error);
            isAnimatingRef.current = false;
        }
    }, [phases, skipAnimation, skipAllAnimations, createTrackedTimeout, safeSetVisibleMessages, safeSetIsTyping]);

    const startAnimation = useCallback(() => {
        // Don't proceed if component is unmounted
        if (!isMountedRef.current) {
            console.warn('startAnimation called after unmount');
            return;
        }
        
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