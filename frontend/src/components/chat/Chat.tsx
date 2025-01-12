// src/components/chat/Chat.tsx

"use client";

import React, { useEffect, useRef } from 'react';
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
import '@/styles/chat.css';

export const Chat: React.FC = () => {
    const chatRef = useRef<Element>(null);
    const inView = useInView(chatRef);
    const animationStarted = useRef(false);
    const { isLoading } = useChatStore();

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

    useEffect(() => {
        if (inView && !animationStarted.current) {
            animationStarted.current = true;
            startAnimation();
        }
    }, [inView, startAnimation]);

    return (
        <div ref={chatRef} className="chat-container">
            <div className="messages-container">
                <ChatMessages
                    initialMessages={visibleMessages}
                    isTyping={isTyping || isLoading}
                />
            </div>
            <div className="chat-input-container">
                <ChatInput />
            </div>
        </div>
    );
};