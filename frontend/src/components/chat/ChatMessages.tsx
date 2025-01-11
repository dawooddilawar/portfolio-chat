// src/components/chat/ChatMessages.tsx

import React, { useEffect, useRef } from 'react';
import { Avatar } from './Avatar';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '@/store/chatStore';
import '@/styles/animations/chatAnimations.css';
import {Message} from "@/config/messages";

interface ChatMessagesProps {
    initialMessages?: Message[];
    isTyping?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
                                                              initialMessages = [],
                                                              isTyping = false
                                                          }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { messages } = useChatStore();

    console.log('Current messages in ChatMessages:', messages); // Debug log

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const renderMessageContent = (message: Message) => {
        if (message.links) {
            let content = message.content;
            message.links.forEach(link => {
                content = content.replace(
                    link.text,
                    `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="text-[#00FF2A] hover:opacity-80">${link.text}</a>`
                );
            });
            return <div dangerouslySetInnerHTML={{ __html: content }} />;
        }
        return message.content;
    };

    const getMessageStyle = (message: Message) => {
        let className = 'message-wrapper';
        className += message.isLastInGroup ? ' mb-[30px]' : ' mb-[10px]';
        className += message.type === 'user' ? ' flex-row-reverse' : '';
        return className;
    };

    const allMessages = [...initialMessages, ...messages];

    return (
        <>
            {allMessages.map((message) => (
                <div
                    key={message.id}
                    className={getMessageStyle(message)}
                >
                    {message.isLastInGroup && <Avatar className="mt-2 ml-2" type={message.type} />}
                    {!message.isLastInGroup && <div className="mt-2 ml-2 w-8 h-8" />}

                    <div
                        className={`message-content pixel-corners`}
                        style={{ width: message.width === 'auto' ? 'auto' : `${message.width}px` }}
                    >
                        {renderMessageContent(message)}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="message-wrapper mb-[30px]">
                    <Avatar className="mt-2 ml-2" type="assistant"/>
                    <TypingIndicator />
                </div>
            )}
            <div ref={messagesEndRef} />
        </>
    );
};