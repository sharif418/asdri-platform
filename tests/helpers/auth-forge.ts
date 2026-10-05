import { mock } from "bun:test";
import { createHmac, createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { SESSION_COOKIE, CSRF_HEADER } from "@/lib/auth";

/**
 * In-process session forging for exercising route handlers without a browser.
 *
 * The production cookie format (src/lib/auth.ts) is
 *   `sessionId.token.mac` where mac = base64url(HMAC-SHA256(SESSION_SECRET, `${sessionId}:${token}`))
 * and the DB stores only sha256(token). Re-implemented here so tests can
 * construct (or tamper with) cookie values; the session row itself is created
 * through the real createSession().
 */

export function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-only-session-secret-not-for-production";
}

export function forgeCookie(sessionId: string, token: string): string {
  const mac = createHmac("sha256", sessionSecret()).update(`${sessionId}:${token}`).digest("base64url");
  return `${sessionId}.${token}.${mac}`;
}

export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

interface CookieStore {
  get(name: string): { value: string } | undefined;
}

/**
 * Install a next/headers mock whose cookie jar is controlled by the returned
 * setter. Call BEFORE importing the route handlers under test.
 */
export function installCookieMock(): (value: string | undefined) => void {
  let cookieValue: string | undefined;
  const store: CookieStore = {
    get: (name: string) => (name === SESSION_COOKIE ? { value: cookieValue ?? "" } : undefined),
  };
  mock.module("next/headers", () => ({
    cookies: async () => store,
    headers: async () => ({ get: () => undefined }),
  }));
  return (value: string | undefined) => {
    cookieValue = value;
  };
}

/** JSON Request for invoking route handlers directly. */
export function jsonRequest(url: string, body: unknown, headers?: Record<string, string>): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

/** JSON Request with the CSRF double-submit header for admin handlers. */
export function csrfJsonRequest(url: string, body: unknown, csrfToken: string): NextRequest {
  return jsonRequest(url, body, { [CSRF_HEADER]: csrfToken });
}
