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
    const { isLoading } = useChatStore();
    const { setSkipAnimation } = useAnimationStore();

    // Add component lifecycle logging
    useEffect(() => {
        console.log('Chat component mounted');
        return () => {
            console.log('Chat component unmounted');
        };
    }, []);

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
        console.log('Message submitted, skipping animations');
        skipAllAnimations();
    }, [skipAllAnimations]);

    // Handle skip button click
    const handleSkip = useCallback(() => {
        console.log('Skip requested from Chat component');
        skipAllAnimations();
    }, [skipAllAnimations]);

    useEffect(() => {
        if (inView && !animationStarted.current) {
            console.log('Animation starting due to inView');
            animationStarted.current = true;
            startAnimation();
        }
    }, [inView, startAnimation]);

    // Determine if skip button should be shown
    // Show when animation has started but not finished
    const showSkipButton = hasStartedAnimation && !hasFinishedAnimation;
    
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