import type { NextConfig } from "next";
const config: NextConfig = {
  output: process.env.STANDALONE === "1" ? "standalone" : undefined,
  async rewrites() {
    const upstream = process.env.API_INTERNAL_URL || "http://localhost:8080";
    return ["api", "files", "demo"].map((path) => ({
      source: `/${path}/:path*`,
      destination: `${upstream}/${path}/:path*`,
    }));
  },
};
export default config;
