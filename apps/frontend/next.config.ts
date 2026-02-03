import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true, // Helps with SPA routing when served by backend
  typescript: {
    // Skip type checking in build - we do this in CI anyway
    // This also avoids Bun segfaults in Docker
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint in build - we do this in CI anyway
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
