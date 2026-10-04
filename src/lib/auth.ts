import { createHmac, randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import type { Session, User, UserRole } from "@prisma/client";

/**
 * Session authentication for staff and applicants.
 *
 * - scrypt password hashing (node:crypto, no native deps)
 * - sessions stored in Postgres (revocable, auditable); the cookie carries
 *   `id.token` where token is random and only its SHA-256 is stored
 * - cookie value is additionally HMAC-signed so tampering fails before any
 *   DB roundtrip
 * - every session carries a CSRF token (double-submit header + binding)
 * - roles are enforced here (data layer), not only in the UI
 */

export const SESSION_COOKIE = "asr-session";
export const CSRF_COOKIE = "asr-csrf";
export const CSRF_HEADER = "x-csrf-token";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;

export interface FullSession {
  session: Session;
  user: User;
}

/* ————————— password hashing ————————— */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split(":");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/* ————————— token helpers ————————— */

function sign(value: string): string {
  return createHmac("sha256", env.sessionSecret).update(value).digest("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function packCookie(sessionId: string, token: string): string {
  return `${sessionId}.${token}.${sign(`${sessionId}:${token}`)}`;
}

function unpackCookie(value: string): { sessionId: string; token: string } | null {
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [sessionId, token, mac] = parts;
  const expected = sign(`${sessionId}:${token}`);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { sessionId, token };
}

/* ————————— session lifecycle ————————— */

export async function createSession(
  userId: string,
  meta: { ip?: string; userAgent?: string } = {},
): Promise<{ csrfToken: string; cookieValue: string; maxAge: number }> {
  const token = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000);
  const session = await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      csrfToken,
      expiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });
  return { csrfToken, cookieValue: packCookie(session.id, token), maxAge: SESSION_TTL_SEC };
}

export async function destroySession(sessionId: string): Promise<void> {
  await db.session.deleteMany({ where: { id: sessionId } });
}

/** Read + verify the session from cookies. Returns null when invalid. */
export async function getSession(): Promise<FullSession | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const unpacked = unpackCookie(raw);
  if (!unpacked) return null;

  const session = await db.session.findUnique({
    where: { id: unpacked.sessionId },
    include: { user: true },
  });
  if (!session) return null;
  if (session.tokenHash !== hashToken(unpacked.token)) return null;
  if (session.expiresAt < new Date() || !session.user.isActive) {
    await db.session.deleteMany({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return { session, user: session.user };
}

/** Current user or null (public pages' account island). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const s = await getSession();
  if (!s) return null;
  return { id: s.user.id, email: s.user.email, name: s.user.name, role: s.user.role };
}

/* ————————— CSRF ————————— */

export function verifyCsrf(session: Session, headerToken: string | null): boolean {
  if (!headerToken) return false;
  const a = Buffer.from(headerToken);
  const b = Buffer.from(session.csrfToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Route-handler guard: session + CSRF for any state-changing request. */
export async function requireCsrf(request: Request): Promise<FullSession | null> {
  const s = await getSession();
  if (!s) return null;
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!verifyCsrf(s.session, headerToken ?? null)) return null;
  return s;
}

/* ————————— role enforcement (data layer) ————————— */

export const STAFF_ROLES: UserRole[] = ["ADMIN", "EDITOR", "ADMISSIONS", "FINANCE", "FATWA"];

export function isStaff(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

/** Permission matrix: which role may mutate which module. */
const MODULE_ROLES: Record<string, UserRole[]> = {
  settings: ["ADMIN"],
  users: ["ADMIN"],
  flags: ["ADMIN"],
  menus: ["ADMIN", "EDITOR"],
  media: ["ADMIN", "EDITOR", "ADMISSIONS", "FINANCE", "FATWA"],
  content: ["ADMIN", "EDITOR"],
  academics: ["ADMIN", "EDITOR"],
  admissions: ["ADMIN", "ADMISSIONS"],
  finance: ["ADMIN", "FINANCE"],
  fatwa: ["ADMIN", "FATWA", "EDITOR"],
  audit: ["ADMIN"],
  messages: ["ADMIN", "EDITOR", "ADMISSIONS"],
};

export type AdminModule = keyof typeof MODULE_ROLES | string;

export function roleCan(role: UserRole, module: AdminModule): boolean {
  const allowed = MODULE_ROLES[module];
  if (!allowed) return role === "ADMIN";
  return allowed.includes(role);
}

/** Guard for admin APIs: session + CSRF + module permission. 403 on failure. */
export async function requireModule(
  request: Request,
  module: AdminModule,
): Promise<{ session: FullSession } | { error: "unauth" | "forbidden"; status: 401 | 403 }> {
  const session = await requireCsrf(request);
  if (!session) return { error: "unauth", status: 401 };
  if (!roleCan(session.user.role, module)) return { error: "forbidden", status: 403 };
  return { session };
}

export async function requireStaff(
  request: Request,
): Promise<{ session: FullSession } | { error: "unauth"; status: 401 }> {
  const session = await requireCsrf(request);
  if (!session) return { error: "unauth", status: 401 };
  if (!isStaff(session.user.role)) return { error: "unauth", status: 401 };
  return { session };
}

export function unauthorized(message = "অননুমোদিত অনুরোধ।") {
  return Response.json({ ok: false, error: message }, { status: 401 });
}

export function forbidden(message = "এই কাজের অনুমতি আপনার নেই।") {
  return Response.json({ ok: false, error: message }, { status: 403 });
}
