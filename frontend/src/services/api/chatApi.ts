import { Message } from '@/config/messages';
import { ChatMessage } from '@/types/chat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ChatApi {
    private baseUrl: string;

    constructor() {
        this.baseUrl = `${API_URL}/api/v1`;
        console.log('ChatApi initialized with baseUrl:', this.baseUrl);
    }

    async sendMessage(message: string): Promise<Message> {
        console.log('Sending message to API:', message);
        try {
            const response = await fetch(`${this.baseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API error response:', errorData);
                throw new Error(`API error: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            console.log('API response data:', data);

            return {
                id: Date.now().toString(),
                content: data.response,
                type: 'assistant',
                isLastInGroup: true,
                groupId: Date.now(),
                width: 'auto',
            };
        } catch (error) {
            console.error('Error in sendMessage:', error);
            throw error;
        }
    }
}