import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Monorepo root: silence the workspace-root inference warning caused by
    // a stray package-lock.json above the project directory.
    root: fileURLToPath(new URL("..", import.meta.url)),
  },
};

export default nextConfig;
