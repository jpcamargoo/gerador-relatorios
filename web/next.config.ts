import type { NextConfig } from "next";
import path from "path";

const API_URL = process.env.API_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: "/api-docs",
        destination: `${API_URL}/api-docs`,
      },
      {
        source: "/api-docs/:path*",
        destination: `${API_URL}/api-docs/:path*`,
      },
    ];
  },
};

export default nextConfig;
