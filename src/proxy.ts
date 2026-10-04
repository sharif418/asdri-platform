import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy (Next.js 16 "proxy" file convention, formerly middleware) —
 * defense-in-depth for authenticated areas plus OWASP security headers on
 * every response.
 *
 * The HMAC session token is verified with Web Crypto (edge-compatible) using
 * the same secret + payload scheme as src/lib/auth.ts. Page-level
 * getAdminSession() gates remain the primary authorization layer.
 */

const SESSION_COOKIE = "asr-session";

interface SessionPayload {
  id: string;
  name: string;
  email: string;
  role: "student" | "donor" | "alumni" | "admin";
  exp: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    return "as-sunnah-dev-secret-fallback-change-me"; // mirrors lib/auth.ts dev fallback
  }
  return secret;
}

/** base64url → Uint8Array over a plain ArrayBuffer (edge-safe, no Buffer). */
function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify("HMAC", key, base64UrlToBytes(signature), new TextEncoder().encode(body));
    if (!valid) return null;

    const decoded = new TextDecoder().decode(base64UrlToBytes(body));
    const payload = JSON.parse(decoded) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  return response;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAccountArea = pathname === "/account" || pathname.startsWith("/account/");

  if (isAdminArea || isAccountArea) {
    const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
    if (isAdminArea && session.role !== "admin") {
      // Non-admins probing /admin are quietly routed home.
      return applySecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|sw.js|robots.txt|sitemap.xml|feed.xml|images|icons).*)"],
};
