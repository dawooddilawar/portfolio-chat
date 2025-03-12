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
    const chatRef = useRef<Element>(null);
    const inView = useInView(chatRef);
    const animationStarted = useRef(false);
    const { isLoading } = useChatStore();
    const { setSkipAnimation } = useAnimationStore();

    const {
        visibleMessages,
        isTyping,
        startAnimation
    } = useAnimationSequence([
        introductionPhase,
        projectPhase,
        interestsPhase,
        contactPhase,
    ]);

    // Handle user input to skip animations
    const handleUserInputStarted = () => {
        setSkipAnimation(true);
    };

    useEffect(() => {
        if (inView && !animationStarted.current) {
            animationStarted.current = true;
            startAnimation();
        }
    }, [inView, startAnimation]);

    return (
        <div ref={chatRef} className="chat-container">
            <div className="messages-container relative">
                <ChatMessages
                    initialMessages={visibleMessages}
                    isTyping={isTyping || isLoading}
                />
                
                {/* Skip button - only shown during animation */}
                {isTyping && (
                    <div className="absolute top-4 right-4">
                        <SkipButton />
                    </div>
                )}
            </div>
            <div className="chat-input-container">
                <ChatInput onInputStarted={handleUserInputStarted} />
            </div>
        </div>
    );
};