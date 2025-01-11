# Interactive Portfolio Chat

This is a [Next.js, FastAPI](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). The project serves as an interactive portfolio website that combines a terminal-styled chat interface with AI-powered chat capabilities.

## Getting Started

First, run the development server in the frontend directory:

```bash
npm run dev
```
or
```bash
yarn dev
```
or
```bash
pnpm dev
```

Next, to start the backend server, navigate to the backend directory and run:

```bash
cd backend
uvicorn app.main:app
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Features

- **Terminal-Styled Chat Interface**: Engage with a modern, terminal-inspired design that provides a unique user experience.
- **AI-Powered Chat**: Interact with an AI system trained on the owner's resume, project details, and professional experience, providing contextual responses.
- **Animated Introduction**: The website features an animated introduction sequence that introduces the owner and their work with a typewriter effect.
- **Command System**: Users can interact with the chat interface using terminal-like commands such as `/help`, `/about`, and `/projects`.
- **Responsive Design**: The application is designed to be responsive, ensuring a seamless experience across devices.

## Learn More


## Project Structure

The project follows a modular, component-based architecture using Next.js and TypeScript. Here’s a brief overview of the directory structure:

- **frontend/**: Contains all the client-side components and pages.
- **backend/**: Contains the server-side logic and API endpoints.




