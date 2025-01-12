export interface Message {
    id: string;
    content: string;
    type: 'user' | 'assistant' | 'system' | 'header';
    groupId: number;
    isLastInGroup: boolean;
    width: number | 'auto'; // Width in pixels
    links?: Array<{
        text: string;
        url: string;
    }>;
}

export const introductionPhase: Message[] = [
    {
        id: 'intro-1',
        content: "Hey, I'm Dawood! A software engineer focused on building products people love, based in Berlin.",
        type: 'assistant',
        groupId: 1,
        isLastInGroup: false,
        width: 411
    },
    {
        id: 'intro-2',
        content: "I'm working on bridging the gap between human emotions and machine understanding through my research in attachment style classification and emotional analysis, while pursuing my Master's in Media Informatics.",
        type: 'assistant',
        groupId: 1,
        isLastInGroup: true,
        width: 394
    }
];

export const projectPhase: Message[] = [
    {
        id: 'projects-header',
        content: "Unpolished Projects",
        type: 'header',
        groupId: 2,
        isLastInGroup: false,
        width: 165
    },
    {
        id: 'project-1',
        content: "Recently built Design Space AI\n\nIt helps real estate agents and interior designers preview room designs instantly. Just snap a photo, and the AI transforms it into different style variations. Some cool tech behind it: - Built an end-to-end image processing pipeline, based on FluXi - Developed a user-friendly project management system - Handled everything from ML implementation to UI/UX",
        type: 'assistant',
        groupId: 2,
        isLastInGroup: true,
        width: 411
    }
];

export const interestsPhase: Message[] = [
    {
        id: 'interests-1',
        content: "When I'm not coding, you can find me exploring the intersection of AI and design, or working on side projects that combine technology with real-world impact.",
        type: 'assistant',
        groupId: 3,
        isLastInGroup: false,
        width: 385
    },
    {
        id: 'interests-2',
        content: "Currently fascinated by agentic workflows in medical AI applications and small business improvements.",
        type: 'assistant',
        groupId: 3,
        isLastInGroup: true,
        width: 348
    }
];

export const contactPhase: Message[] = [
    {
        id: 'contact',
        content: "Check my Github or say hello on Twitter or email.",
        type: 'assistant',
        groupId: 4,
        isLastInGroup: true,
        width: 'auto',
        links: [
            { text: 'Github', url: 'https://github.com/dawooddilawar' },
            { text: 'Twitter', url: 'https://x.com/dawooddilawar1' },
            { text: 'email', url: 'mailto:dawoodiliawar94@gmail.com' }
        ]
    }
];

export const finalMessage: Message = {
    id: 'final',
    content: "Have questions about me? You can ask here!",
    type: 'assistant',
    groupId: 5,
    isLastInGroup: true,
    width: 378
};

export const helpMessage: Message = {
    id: 'help',
    content: `Available commands:
- help: Display this help message
- clear: Clear chat history
- about: Learn more about me
- projects: View my featured projects`,
    type: 'system',
};

export const errorMessage: Message = {
    id: 'error',
    content: 'Sorry, I encountered an error. Please try again.',
    type: 'system',
};

export const loadingMessage: Message = {
    id: 'loading',
    content: 'Thinking...',
    type: 'system',
};