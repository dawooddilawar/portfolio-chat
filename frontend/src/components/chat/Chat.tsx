// src/components/chat/Chat.tsx

"use client";

import React, { useEffect, useRef, useCallback, useState, ErrorInfo } from 'react';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { useAnimationSequence } from '@/hooks/useAnimationSequence';
import { useInView } from '@/hooks/useInView';
import {
    introductionPhase,
    projectPhase,
    interestsPhase,
    contactPhase,
} from '@/config/messages';
import { useChatStore } from '@/store/chatStore';
import { useAnimationStore } from '@/store/animationStore';
import '@/styles/chat.css';

// Error boundary component to catch and handle errors
class ErrorBoundary extends React.Component<
    { children: React.ReactNode, fallback?: React.ReactNode },
    { hasError: boolean, error: Error | null }
> {
    constructor(props: { children: React.ReactNode, fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Chat component error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="error-container">
                    <h2>Something went wrong.</h2>
                    <p>Please refresh the page to try again.</p>
                    <details>
                        <summary>Error details</summary>
                        <pre>{this.state.error?.toString()}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export const Chat: React.FC = () => {
    const chatRef = useRef<HTMLDivElement>(null);
    const inView = useInView(chatRef);
    const animationStarted = useRef(false);
    const isMountedRef = useRef(true);
    const skipRequestedRef = useRef(false);
    const { isLoading } = useChatStore();
    const { skipAnimation, setSkipAnimation } = useAnimationStore();
    const [hasError, setHasError] = useState(false);

    // Add component lifecycle logging and tracking
    useEffect(() => {
        console.log('Chat component mounted');
        isMountedRef.current = true;
        skipRequestedRef.current = false;
        
        return () => {
            console.log('Chat component unmounted');
            isMountedRef.current = false;
            
            // Reset animation state on unmount to prevent state updates
            setSkipAnimation(true);
        };
    }, [setSkipAnimation]);

    const {
        visibleMessages,
        isTyping,
        startAnimation,
        skipAllAnimations,
        hasStartedAnimation,
        hasFinishedAnimation
    } = useAnimationSequence([
        introductionPhase,
        projectPhase,
        interestsPhase,
        contactPhase,
    ]);

    // Handle user message submission to skip animations
    const handleMessageSubmit = useCallback(() => {
        if (!isMountedRef.current) {
            console.warn('handleMessageSubmit called after unmount');
            return;
        }
        
        // Prevent duplicate skip requests
        if (skipRequestedRef.current) {
            console.log('Skip already requested, ignoring duplicate call');
            return;
        }
        
        skipRequestedRef.current = true;
        console.log('Message submitted, skipping animations');
        
        try {
            skipAllAnimations();
        } catch (error) {
            console.error('Error in handleMessageSubmit:', error);
            setHasError(true);
        } finally {
            // Reset skip requested flag after a short delay
            setTimeout(() => {
                skipRequestedRef.current = false;
            }, 100);
        }
    }, [skipAllAnimations]);

    // Handle skip button click
    const handleSkip = useCallback(() => {
        if (!isMountedRef.current) {
            console.warn('handleSkip called after unmount');
            return;
        }
        
        // Prevent duplicate skip requests
        if (skipRequestedRef.current) {
            console.log('Skip already requested, ignoring duplicate call');
            return;
        }
        
        skipRequestedRef.current = true;
        console.log('Skip requested from Chat component');
        
        try {
            skipAllAnimations();
        } catch (error) {
            console.error('Error in handleSkip:', error);
            setHasError(true);
        } finally {
            // Reset skip requested flag after a short delay
            setTimeout(() => {
                skipRequestedRef.current = false;
            }, 100);
        }
    }, [skipAllAnimations]);

    // Start animation when component comes into view
    useEffect(() => {
        if (inView && !animationStarted.current && isMountedRef.current) {
            console.log('Animation starting due to inView');
            animationStarted.current = true;
            try {
                startAnimation();
            } catch (error) {
                console.error('Error starting animation:', error);
                setHasError(true);
            }
        }
    }, [inView, startAnimation]);

    // Memoize the skip button visibility calculation
    const showSkipButton = useCallback(() => {
        return hasStartedAnimation && !hasFinishedAnimation && !skipAnimation;
    }, [hasStartedAnimation, hasFinishedAnimation, skipAnimation])();
    
    console.log('Chat render state:', { 
        hasStartedAnimation, 
        hasFinishedAnimation, 
        showSkipButton, 
        isTyping,
        messageCount: visibleMessages.length,
        skipAnimation
    });

    // If there's an error, show a simple error message
    if (hasError) {
        return (
            <div className="chat-container">
                <div className="error-container">
                    <h2>Something went wrong with the chat.</h2>
                    <p>Please refresh the page to try again.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="pixel-corners text-[color:var(--primary)] border-[color:var(--primary)] px-3 py-1.5 mt-4"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div ref={chatRef} className="chat-container">
                <div className="messages-container relative">
                    <ChatMessages
                        initialMessages={visibleMessages}
                        isTyping={isTyping || isLoading}
                        onSkip={handleSkip}
                        showSkipButton={showSkipButton}
                    />
                </div>
                <div className="chat-input-container">
                    <ChatInput onInputStarted={handleMessageSubmit} />
                </div>
            </div>
        </ErrorBoundary>
    );
};