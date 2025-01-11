export type MessageType = 'user' | 'assistant' | 'system' | 'header';

export interface ChatMessage {
    id: string;
    content: string;
    type: MessageType;
    isLastInGroup: boolean;
    groupId: number;
    width: number;
    links?: Array<{
        text: string;
        url: string;
    }>;
}