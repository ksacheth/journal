import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const normalizedApiUrl = apiUrl.endsWith("/")
  ? apiUrl.slice(0, -1)
  : apiUrl;

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${normalizedApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
