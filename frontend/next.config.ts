// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['api.placeholder'],
    },
    eslint: {
        // This will completely disable ESLint during builds
        ignoreDuringBuilds: true,
    },
    typescript: {
        // This will completely disable TypeScript checks during builds
        ignoreBuildErrors: true,
    }
};

export default nextConfig;