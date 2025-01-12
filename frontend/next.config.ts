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
};

export default nextConfig;