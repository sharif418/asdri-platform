import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Strict builds — the Round-1 escape hatches are gone for good.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // uploads are streamed from our own storage route — same-origin, no remote hosts
    remotePatterns: [],
  },
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
