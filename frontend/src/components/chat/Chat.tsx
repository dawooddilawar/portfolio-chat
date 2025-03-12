// src/components/chat/Chat.tsx

"use client";

import React, { useEffect, useRef } from 'react';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { SkipButton } from '@/components/chat/SkipButton';
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
    const handleMessageSubmit = () => {
        skipAllAnimations();
    };

    useEffect(() => {
        if (inView && !animationStarted.current) {
            animationStarted.current = true;
            startAnimation();
        }
    }, [inView, startAnimation]);

    // Determine if skip button should be shown
    // Show when animation has started but not finished
    const showSkipButton = hasStartedAnimation && !hasFinishedAnimation;

    return (
        <div ref={chatRef} className="chat-container">
            <div className="messages-container relative">
                <ChatMessages
                    initialMessages={visibleMessages}
                    isTyping={isTyping || isLoading}
                />
                
                {/* Skip button - shown from first message until animation completes */}
                {showSkipButton && (
                    <div className="absolute top-4 right-4">
                        <SkipButton onSkip={skipAllAnimations} />
                    </div>
                )}
            </div>
            <div className="chat-input-container">
                <ChatInput onInputStarted={handleMessageSubmit} />
            </div>
        </div>
    );
};