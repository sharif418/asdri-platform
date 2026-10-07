import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Signed, expiring preview links (round 4, workstream 5).
 *
 * A preview link lets the office (or anyone they hand the URL to) read a
 * Notice/Post through the public render before it is published. The token is
 *   base64url(payload) + "." + base64url(HMAC-SHA256(sessionSecret, body))
 * with payload = JSON { entity, entityId, exp } — the same shape as the
 * sandbox checkout grant / session-cookie MAC (constant-time compare, 24h
 * TTL). Tampering with any byte fails the MAC before the payload is parsed.
 */

export const PREVIEW_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type PreviewEntity = "Notice" | "Post";

export interface PreviewPayload {
  entity: PreviewEntity;
  entityId: string;
  /** Expiry, epoch seconds. */
  exp: number;
}

export function isPreviewEntity(value: unknown): value is PreviewEntity {
  return value === "Notice" || value === "Post";
}

/** Mint a preview token for one entity row (exp = now + 24h). */
export function signPreviewToken(entity: PreviewEntity, entityId: string, nowMs: number = Date.now()): string {
  const payload: PreviewPayload = {
    entity,
    entityId,
    exp: Math.floor((nowMs + PREVIEW_TTL_MS) / 1000),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const mac = createHmac("sha256", env.sessionSecret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

/** Constant-time comparison of the token's MAC against the expected one. */
function macMatches(body: string, givenMac: string): boolean {
  const expected = createHmac("sha256", env.sessionSecret).update(body).digest("base64url");
  const a = Buffer.from(givenMac, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Verify a preview token. Returns the payload only when the MAC is genuine,
 * the entity is a previewable one, and the link has not expired — every other
 * shape (garbage, tampered signature, wrong entity, past expiry) is null so
 * invalid links are indistinguishable, like the accept-invite page.
 */
export function verifyPreviewToken(token: string, nowMs: number = Date.now()): PreviewPayload | null {
  const dot = token.indexOf(".");
  if (dot <= 0 || token.length === dot + 1) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  // MAC first — a forged payload never gets past this line.
  if (!macMatches(body, mac)) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (raw === null || typeof raw !== "object") return null;
  const payload = raw as Partial<PreviewPayload>;
  if (!isPreviewEntity(payload.entity)) return null;
  if (typeof payload.entityId !== "string" || !payload.entityId) return null;
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return null;
  if (payload.exp * 1000 <= nowMs) return null; // expired links never open
  return { entity: payload.entity, entityId: payload.entityId, exp: payload.exp };
}
