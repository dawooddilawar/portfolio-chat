// src/app/layout.tsx

import type { Metadata } from 'next';
import { Overpass_Mono } from 'next/font/google';
import '@/app/globals.css';
import Navigation from '@/components/nav/Navigation'
import { ThemeProvider } from '@/contexts/ThemeContext'

const overpassMono = Overpass_Mono({ 
    subsets: ['latin'],
    // Include the weight range you want to use
    weight: ['300', '400', '500', '600', '700']
});

export const metadata: Metadata = {
    title: 'Interactive Portfolio Chat',
    description: 'A terminal-styled portfolio with AI-powered chat capabilities',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className={`${overpassMono.className}`}>
            <main className="min-h-screen">
                <ThemeProvider>
                    <Navigation />
                    {children}
                </ThemeProvider>
            </main>
        </body>
        </html>
    );
}