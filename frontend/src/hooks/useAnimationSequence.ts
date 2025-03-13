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
    const isSkippingRef = useRef(false); // Track if skip operation is in progress
    const skipDebounceTimeoutRef = useRef<number | null>(null); // For debouncing skip operations
    const { skipAnimation, setSkipAnimation } = useAnimationStore();

    // Set up mount/unmount tracking
    useEffect(() => {
        console.log('useAnimationSequence hook initialized');
        isMountedRef.current = true;
        isSkippingRef.current = false;
        
        return () => {
            console.log('useAnimationSequence hook cleanup');
            isMountedRef.current = false;
            
            // Clear debounce timeout if it exists
            if (skipDebounceTimeoutRef.current !== null) {
                clearTimeout(skipDebounceTimeoutRef.current);
                skipDebounceTimeoutRef.current = null;
            }
            
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
        if (!isMountedRef.current) {
            console.warn('Attempted to update visibleMessages after unmount');
            return;
        }
        
        try {
            // Use a try-catch block to handle potential errors
            setVisibleMessages(updater);
        } catch (error) {
            console.error('Error updating visibleMessages:', error);
            
            // If there's an error, try a simpler update approach
            if (typeof updater === 'function') {
                try {
                    // Get the current state
                    const currentMessages = visibleMessages;
                    // Apply the updater function
                    const newMessages = (updater as (prev: Message[]) => Message[])(currentMessages);
                    // Set the state directly
                    setVisibleMessages(newMessages);
                } catch (fallbackError) {
                    console.error('Fallback error updating visibleMessages:', fallbackError);
                }
            }
        }
    }, [visibleMessages]);

    const safeSetIsTyping = useCallback((value: boolean) => {
        if (!isMountedRef.current) {
            console.warn('Attempted to update isTyping after unmount');
            return;
        }
        
        try {
            setIsTyping(value);
        } catch (error) {
            console.error('Error updating isTyping:', error);
        }
    }, []);

    // Debounced skip function to prevent multiple rapid calls
    const debouncedSkip = useCallback((callback: () => void) => {
        // Clear any existing debounce timeout
        if (skipDebounceTimeoutRef.current !== null) {
            clearTimeout(skipDebounceTimeoutRef.current);
        }
        
        // Set a new debounce timeout
        skipDebounceTimeoutRef.current = window.setTimeout(() => {
            skipDebounceTimeoutRef.current = null;
            if (isMountedRef.current) {
                callback();
            }
        }, 50); // 50ms debounce time
    }, []);

    // Function to skip all animations and show all messages
    const skipAllAnimations = useCallback(() => {
        console.log('skipAllAnimations called');
        
        // Only proceed if component is still mounted
        if (!isMountedRef.current) {
            console.warn('skipAllAnimations called after unmount');
            return;
        }
        
        // Prevent duplicate skip operations
        if (isSkippingRef.current) {
            console.log('Skip operation already in progress, ignoring duplicate call');
            return;
        }
        
        // Mark skip operation as in progress
        isSkippingRef.current = true;
        
        // Use debounced skip to prevent multiple rapid calls
        debouncedSkip(() => {
            try {
                // Clear all pending timeouts
                clearAllTimeouts();
                
                // Flatten all phases into a single array of messages
                const allMessages = phases.flat().filter(Boolean);
                
                // Update state safely
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
            } finally {
                // Reset skip operation status
                isSkippingRef.current = false;
            }
        });
    }, [phases, clearAllTimeouts, setSkipAnimation, safeSetVisibleMessages, safeSetIsTyping, debouncedSkip]);

    // Check if animation should be skipped (from store)
    useEffect(() => {
        if (skipAnimation && isMountedRef.current && !isSkippingRef.current) {
            console.log('Skip animation detected from store, calling skipAllAnimations');
            skipAllAnimations();
        }
    }, [skipAnimation, skipAllAnimations]);

    // Create a timeout that can be tracked and cleared
    const createTrackedTimeout = useCallback((callback: () => void, delay: number) => {
        // Don't create new timeouts if component is unmounting or if skip is active
        if (!isMountedRef.current || skipAnimation) {
            console.warn('Attempted to create timeout after unmount or during skip');
            return -1;
        }
        
        // Wrap callback in try-catch and mount check
        const safeCallback = () => {
            // Remove this timeout from the tracking array when it completes
            timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId);
            
            // Only execute callback if component is still mounted and not skipping
            if (isMountedRef.current && !skipAnimation) {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in timeout callback:', error);
                }
            } else {
                console.warn('Timeout callback prevented after unmount or during skip');
            }
        };
        
        // Create the timeout with the safe callback
        const timeoutId = window.setTimeout(safeCallback, delay);
        
        // Add this timeout to the tracking array
        timeoutsRef.current.push(timeoutId);
        console.log(`Created timeout ${timeoutId}, total active: ${timeoutsRef.current.length}`);
        
        return timeoutId;
    }, [skipAnimation]);

    // Add a single message with proper error handling
    const addMessage = useCallback((message: Message) => {
        if (!isMountedRef.current || skipAnimation) return;
        
        if (!message) {
            console.error('Attempted to add undefined message');
            return;
        }
        
        try {
            safeSetVisibleMessages(prev => [...prev, message]);
        } catch (error) {
            console.error('Error adding message:', error);
        }
    }, [safeSetVisibleMessages, skipAnimation]);

    // Simplified phase player that uses fewer timeouts
    const playNextPhase = useCallback(() => {
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
                
                // Add first message immediately
                if (currentPhase[0]) {
                    addMessage(currentPhase[0]);
                }
                
                // Add second message after delay
                createTrackedTimeout(() => {
                    if (!isMountedRef.current || skipAnimation) return;
                    
                    console.log('Adding second message of first phase');
                    if (currentPhase[1]) {
                        addMessage(currentPhase[1]);
                    }
                    
                    // Move to next phase after delay
                    createTrackedTimeout(() => {
                        if (!isMountedRef.current || skipAnimation) return;
                        
                        console.log('First phase complete');
                        currentPhaseRef.current++;
                        isAnimatingRef.current = false;
                        
                        if (currentPhaseRef.current < phases.length && isMountedRef.current) {
                            playNextPhase();
                        }
                    }, 3000); // Reduced from 5000
                }, 500);
            } else {
                // Other phases
                console.log(`Playing phase ${currentPhaseRef.current + 1}`);
                safeSetIsTyping(true);
                
                // Use a single timeout instead of nested ones
                createTrackedTimeout(() => {
                    if (!isMountedRef.current || skipAnimation) return;
                    
                    safeSetIsTyping(false);
                    
                    // Add messages sequentially with a single timeout
                    const addMessagesSequentially = (index = 0) => {
                        if (!isMountedRef.current || skipAnimation) return;
                        
                        if (index < currentPhase.length) {
                            console.log(`Adding message ${index + 1} of phase ${currentPhaseRef.current + 1}`);
                            if (currentPhase[index]) {
                                addMessage(currentPhase[index]);
                            }
                            
                            // Schedule next message
                            createTrackedTimeout(() => {
                                addMessagesSequentially(index + 1);
                            }, 500);
                        } else {
                            // All messages added, move to next phase
                            createTrackedTimeout(() => {
                                if (!isMountedRef.current || skipAnimation) return;
                                
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
                    };
                    
                    // Start adding messages
                    addMessagesSequentially();
                }, 3000); // Reduced from 5000
            }
        } catch (error) {
            console.error('Error in playNextPhase:', error);
            isAnimatingRef.current = false;
        }
    }, [phases, skipAnimation, skipAllAnimations, createTrackedTimeout, safeSetIsTyping, addMessage]);

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