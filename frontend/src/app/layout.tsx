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
    title: 'Dawood Dilawar - Software Engineer Portfolio',
    description: 'Explore the portfolio of Dawood Dilawar, a software engineer specializing in modern web applications, AI integration, and more.',
    openGraph: {
        title: 'Dawood Dilawar - Software Engineer Portfolio',
        description: 'Explore the portfolio of Dawood Dilawar, a software engineer specializing in modern web applications, AI integration, and more.',
        url: 'https://dawooddilawar.com',
        images: [
            {
                url: 'https://dawooddilawar.com/images/assistant.png',
                width: 800,
                height: 600,
                alt: 'Dawood Dilawar Portfolio',
            },
        ],
        siteName: 'Dawood Dilawar\'s Portfolio',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Dawood Dilawar - Software Engineer Portfolio',
        description: 'Explore the portfolio of Dawood Dilawar, a software engineer specializing in modern web applications, AI integration, and more.',
        images: ['https://dawooddilawar.com/images/assistant.png'],
    },
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