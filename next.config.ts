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
  experimental: {
    // app/global-not-found.tsx answers every 404 (unknown routes and
    // notFound() calls) with a real HTTP 404 status + branded UI.
    globalNotFound: true,
  },
  async redirects() {
    return [
      // /admin/login has never been a real page — staff sign in at /login.
      { source: "/admin/login", destination: "/login", permanent: false },
    ];
  },
};

export default nextConfig;
