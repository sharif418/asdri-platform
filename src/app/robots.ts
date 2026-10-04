import type { MetadataRoute } from "next";

/** Canonical site origin — NEXT_PUBLIC_SITE_URL env override wins when set. */
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://assunnahinstitute.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/api/", "/login", "/register", "/admin", "/offline"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
