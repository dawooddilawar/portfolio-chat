// src/app/page.tsx

import { Chat } from '@/components/chat/Chat';
import Blog from '@/components/blog/Blog';

export default function Home() {
    return (
        <>
            <Chat />
            <Blog />
        </>
    );
}