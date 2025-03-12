// src/components/chat/Chat.tsx

"use client";

import React, { useEffect, useRef, useCallback } from 'react';
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

export const Chat: React.FC = () => {
    const chatRef = useRef<HTMLDivElement>(null);
    const inView = useInView(chatRef);
    const animationStarted = useRef(false);
    const isMountedRef = useRef(true);
    const { isLoading } = useChatStore();
    const { setSkipAnimation } = useAnimationStore();

    // Add component lifecycle logging and tracking
    useEffect(() => {
        console.log('Chat component mounted');
        isMountedRef.current = true;
        
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
        
        console.log('Message submitted, skipping animations');
        try {
            skipAllAnimations();
        } catch (error) {
            console.error('Error in handleMessageSubmit:', error);
        }
    }, [skipAllAnimations]);

    // Handle skip button click
    const handleSkip = useCallback(() => {
        if (!isMountedRef.current) {
            console.warn('handleSkip called after unmount');
            return;
        }
        
        console.log('Skip requested from Chat component');
        try {
            skipAllAnimations();
        } catch (error) {
            console.error('Error in handleSkip:', error);
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
            }
        }
    }, [inView, startAnimation]);

    // Memoize the skip button visibility calculation
    const showSkipButton = useCallback(() => {
        return hasStartedAnimation && !hasFinishedAnimation;
    }, [hasStartedAnimation, hasFinishedAnimation])();
    
    console.log('Chat render state:', { 
        hasStartedAnimation, 
        hasFinishedAnimation, 
        showSkipButton, 
        isTyping,
        messageCount: visibleMessages.length
    });

    return (
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
    );
};