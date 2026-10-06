import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Strict builds — the Round-1 escape hatches are gone for good.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  // /admin/login has no page — the public /login serves staff sign-in too.
  redirects: async () => [{ source: "/admin/login", destination: "/login", permanent: false }],
  images: {
    formats: ["image/avif", "image/webp"],
    // uploads are streamed from our own storage route — same-origin, no remote hosts
    remotePatterns: [],
  },
  serverExternalPackages: ["@prisma/client"],
  headers: async () => [
    {
      // Content-hashed font filenames (scripts/subset-fonts.py) — cache forever.
      source: "/fonts/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
  ],
};

export default nextConfig;
