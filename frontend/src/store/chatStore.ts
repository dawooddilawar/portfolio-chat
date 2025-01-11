import { create } from 'zustand';
import { Message } from '@/config/messages';

interface ChatState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    addMessage: (message: Message) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    isLoading: false,
    error: null,
    addMessage: (message) => {
        console.log('chatStore.addMessage called with:', message);
        set((state) => {
            const newMessages = [...state.messages, message];
            console.log('New messages state:', newMessages);
            return { messages: newMessages };
        });
    },
    setLoading: (loading) => {
        console.log('chatStore.setLoading:', loading);
        set({ isLoading: loading });
    },
    setError: (error) => {
        console.log('chatStore.setError:', error);
        set({ error });
    },
    clearMessages: () => {
        console.log('chatStore.clearMessages called');
        set({ messages: [] });
    },
}));