// src/services/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ChatResponse {
    response: string;
    error?: string;
}

export class ApiService {
    private static async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch');
        }
        return response.json();
    }

    static async sendMessage(message: string): Promise<ChatResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            return this.handleResponse<ChatResponse>(response);
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}