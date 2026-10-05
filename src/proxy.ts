import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LANG, isLang } from "@/lib/locale";

/**
 * Proxy (Next.js 16's middleware convention).
 *
 * 1. Locale routing — Bangla is the default, URL-less language: any path not
 *    claimed by /en, /api, /admin, static assets or special routes is
 *    internally rewritten to /bn/<path> (the URL the visitor sees never
 *    changes). /en/<path> passes through untouched. This gives every page
 *    two real, server-rendered URLs — one per language. The signed sandbox
 *    checkout lives at [lang]/checkout/[code], so /checkout/<code> flows
 *    through the default-lang rewrite like every other public page.
 *
 * 2. OWASP security headers on every response.
 */

const RESERVED = [
  "/_next",
  "/api",
  "/admin",
  "/en",
  "/offline",
  "/sw.js",
];

function isReserved(pathname: string): boolean {
  if (RESERVED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  // static files: /logo.svg, /images/hero.png, /favicon.ico, /manifest.webmanifest …
  if (pathname.startsWith("/images/") || pathname.startsWith("/icons/")) return true;
  const last = pathname.split("/").pop() ?? "";
  return /\.[a-zA-Z0-9]{2,12}$/.test(last);
}

function securityHeaders(res: NextResponse, isProd: boolean): NextResponse {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'" + (isProd ? "" : " 'unsafe-eval'"),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com https://youtube-nocookie.com https://maps.google.com https://www.google.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    isProd ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  if (isProd) {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return res;
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const isProd = process.env.NODE_ENV === "production";

  if (isReserved(pathname)) {
    return securityHeaders(NextResponse.next(), isProd);
  }

  // Already-prefixed paths pass through. In the production server the rewritten request
  // re-enters the proxy, so without this check "/" becomes /bn/bn/bn/... until the
  // request line overflows (431). Dev mode does not re-enter, which hid the bug.
  if (pathname === "/bn" || pathname.startsWith("/bn/")) {
    return securityHeaders(NextResponse.next(), isProd);
  }

  // /en/... passes through as the [lang]=en route
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return securityHeaders(NextResponse.next(), isProd);
  }

  // everything else is Bangla (default): rewrite to /bn/... internally
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LANG}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return securityHeaders(NextResponse.rewrite(url), isProd);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
