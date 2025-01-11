// src/store/messagesStore.ts

import { create } from 'zustand';
import { Message } from '@/config/messages';

interface MessagesState {
    messages: Message[];
    isTyping: boolean;
    addMessage: (message: Partial<Message>) => void;
    setTyping: (typing: boolean) => void;
    clearMessages: () => void;
}

let nextId = 0;

export const useMessagesStore = create<MessagesState>((set) => ({
    messages: [],
    isTyping: false,
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
            id: `msg-${nextId++}`,
            type: 'user',
            groupId: state.messages.length,
            isLastInGroup: true,
            width: 'auto',
            ...message,
        }],
    })),
    setTyping: (typing) => set({ isTyping: typing }),
    clearMessages: () => set({ messages: [] }),
}));