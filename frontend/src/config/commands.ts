// src/config/commands.ts

export interface Command {
    name: string;
    description: string;
    handler: () => Promise<string>;
}

const aboutContent = `I'm a software developer with expertise in building modern web applications. 
I specialize in React, TypeScript, and AI integration.`;

const projectsContent = `Featured Projects:
1. Interactive Portfolio - A terminal-styled portfolio with AI chat capabilities
2. [Project 2 Name] - Brief description
3. [Project 3 Name] - Brief description`;

export const commands: Record<string, Command> = {
    help: {
        name: 'help',
        description: 'Display available commands',
        handler: async () => {
            return Object.values(commands)
                .map(cmd => `${cmd.name}: ${cmd.description}`)
                .join('\n');
        },
    },
    about: {
        name: 'about',
        description: 'Learn more about me',
        handler: async () => aboutContent,
    },
    projects: {
        name: 'projects',
        description: 'View featured projects',
        handler: async () => projectsContent,
    },
    clear: {
        name: 'clear',
        description: 'Clear chat history',
        handler: async () => 'Chat history cleared',
    },
};