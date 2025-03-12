// src/components/chat/ChatMessages.tsx

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Avatar } from './Avatar';
import { TypingIndicator } from './TypingIndicator';
import { SkipButton } from './SkipButton';
import { useChatStore } from '@/store/chatStore';
import '@/styles/animations/chatAnimations.css';
import {Message} from "@/config/messages";

interface ChatMessagesProps {
    initialMessages?: Message[];
    isTyping?: boolean;
    onSkip?: () => void;
    showSkipButton?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
    initialMessages = [],
    isTyping = false,
    onSkip,
    showSkipButton = false
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isMountedRef = useRef(true);
    const skipClickedRef = useRef(false);
    const { messages } = useChatStore();
    const [hasError, setHasError] = useState(false);

    // Always include initial messages, then add store messages
    const displayMessages = [...initialMessages, ...messages];

    console.log('ChatMessages render - isTyping:', isTyping, 'showSkipButton:', showSkipButton); // Debug log

    // Track component mount state
    useEffect(() => {
        console.log('ChatMessages component mounted');
        isMountedRef.current = true;
        skipClickedRef.current = false;
        
        return () => {
            console.log('ChatMessages component unmounted');
            isMountedRef.current = false;
        };
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (!isMountedRef.current) return;
        
        // Use requestAnimationFrame to ensure DOM is updated before scrolling
        const scrollTimeout = requestAnimationFrame(() => {
            if (isMountedRef.current && messagesEndRef.current) {
                try {
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                } catch (error) {
                    console.error('Error scrolling to bottom:', error);
                    if (isMountedRef.current) {
                        setHasError(true);
                    }
                }
            }
        });
        
        return () => {
            cancelAnimationFrame(scrollTimeout);
        };
    }, [messages, isTyping, displayMessages.length]);

    const renderMessageContent = useCallback((message: Message) => {
        try {
            // Case 1: If message has explicit links array
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
            
            // Case 2: If the content is HTML (contains tags)
            const containsHTML = /<[^>]*>/g.test(message.content);
            if (containsHTML) {
                // Add the same classes to any <a> tags in the content
                const contentWithStyles = message.content.replace(
                    /<a\s/g,
                    '<a class="text-[#00FF2A] hover:opacity-80" target="_blank" rel="noopener noreferrer" '
                );
                return <div dangerouslySetInnerHTML={{ __html: contentWithStyles }} />;
            }
            
            // Case 3: Plain text content
            return message.content;
        } catch (error) {
            console.error('Error rendering message content:', error);
            if (isMountedRef.current) {
                setHasError(true);
            }
            return 'Error displaying message';
        }
    }, []);

    const getMessageStyle = useCallback((message: Message) => {
        let className = 'message-wrapper';
        className += message.isLastInGroup ? ' mb-[30px]' : ' mb-[10px]';
        className += message.type === 'user' ? ' flex-row-reverse chat-bubble-user' : '';
        return className;
    }, []);

    // Handle skip button click with logging
    const handleSkip = useCallback(() => {
        console.log('Skip button clicked in ChatMessages');
        if (!isMountedRef.current) {
            console.warn('Skip button clicked but ChatMessages is unmounted');
            return;
        }
        
        // Prevent duplicate skip clicks
        if (skipClickedRef.current) {
            console.log('Skip already clicked, ignoring duplicate call');
            return;
        }
        
        skipClickedRef.current = true;
        
        if (onSkip) {
            try {
                onSkip();
            } catch (error) {
                console.error('Error in skip button handler:', error);
                if (isMountedRef.current) {
                    setHasError(true);
                }
            } finally {
                // Reset skip clicked flag after a short delay
                setTimeout(() => {
                    skipClickedRef.current = false;
                }, 100);
            }
        }
    }, [onSkip]);

    // If there's an error, show a simple error message
    if (hasError) {
        return (
            <div className="message-wrapper mb-[30px]">
                <div className="message-content pixel-corners">
                    <p>Error displaying messages. Please refresh the page.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {displayMessages.map((message) => (
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
                    
                    {/* Skip button below typing indicator */}
                    {showSkipButton && (
                        <div className="ml-4 mt-2">
                            <SkipButton onSkip={handleSkip} />
                        </div>
                    )}
                </div>
            )}
            <div ref={messagesEndRef} />
        </>
    );
};