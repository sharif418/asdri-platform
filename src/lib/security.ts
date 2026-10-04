import { NextResponse } from "next/server";

/**
 * Lightweight in-memory sliding-window rate limiter.
 * Suitable for the single-instance deployment of this site.
 */

interface RateWindow {
  timestamps: number[];
}

const buckets = new Map<string, RateWindow>();

export interface RateLimitOptions {
  /** Unique bucket prefix, e.g. "contact". */
  key: string;
  /** Identifier (IP or account). */
  identifier: string;
  /** Max requests inside the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit({ key, identifier, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const bucketKey = `${key}:${identifier}`;
  const now = Date.now();
  const bucket = buckets.get(bucketKey) ?? { timestamps: [] };

  // Prune expired entries.
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    buckets.set(bucketKey, bucket);
    return { ok: false, remaining: 0, retryAfterSec };
  }

  bucket.timestamps.push(now);
  buckets.set(bucketKey, bucket);

  // Opportunistic cleanup of stale buckets to bound memory.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.timestamps.every((ts) => now - ts >= windowMs)) buckets.delete(k);
    }
  }

  return { ok: true, remaining: limit - bucket.timestamps.length, retryAfterSec: 0 };
}

/** Best-effort client IP extraction behind the gateway proxy. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Same-origin protection for state-changing requests (CSRF mitigation layer
 * on top of SameSite cookies).
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients (curl) — validated by rate limits
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function jsonError(
  message: string,
  code:
    | "VALIDATION"
    | "RATE_LIMIT"
    | "SERVER"
    | "NOT_FOUND"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "CONFLICT"
    | "PRECONDITION",
  status: number,
  fields?: Record<string, string>,
): NextResponse {
  return NextResponse.json({ error: message, code, fields }, { status });
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}
