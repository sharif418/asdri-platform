import { describe, test, expect, beforeAll } from "bun:test";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { installCookieMock, jsonRequest, csrfJsonRequest } from "../helpers/auth-forge";
import type { OutboxEmail, User } from "@prisma/client";

/**
 * Finance outbox retry/resend — the REAL PATCH /api/admin/outbox/[id] route
 * handler invoked in-process with a forged session cookie + CSRF header
 * (admissions.test.ts pattern). The test env runs MAIL_DRIVER=log, where the
 * outbox row itself is the delivery record: a "retry" marks the row
 * delivered (sentAt set, error cleared) and increments `attempts`, while
 * "resend" keeps its queue-only semantics (attempts untouched).
 */

process.env.MAIL_DRIVER = "log"; // deterministic driver for this file

const setCookie = installCookieMock();
const { PATCH } = await import("@/app/api/admin/outbox/[id]/route");

let financeSession: { cookieValue: string; csrfToken: string };
let admissionsSession: { cookieValue: string; csrfToken: string };

beforeAll(async () => {
  const suffix = `${Date.now()}`;
  const financeUser: User = await db.user.create({
    data: {
      email: `outbox-finance-${suffix}@test.local`,
      name: "টেস্ট ফাইন্যান্স",
      passwordHash: hashPassword("Password123!"),
      role: "FINANCE",
    },
  });
  const admissionsUser: User = await db.user.create({
    data: {
      email: `outbox-admissions-${suffix}@test.local`,
      name: "টেস্ট ভর্তি",
      passwordHash: hashPassword("Password123!"),
      role: "ADMISSIONS",
    },
  });
  financeSession = await createSession(financeUser.id);
  admissionsSession = await createSession(admissionsUser.id);
});

const url = (id: string) => `http://localhost:3000/api/admin/outbox/${id}`;

const call = (id: string, body: unknown, csrfToken: string) =>
  PATCH(csrfJsonRequest(url(id), body, csrfToken), { params: Promise.resolve({ id }) });

async function seedOutbox(overrides: { attempts?: number; sentAt?: Date | null; error?: string | null } = {}): Promise<OutboxEmail> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return db.outboxEmail.create({
    data: {
      to: `outbox-${suffix}@test.local`,
      subject: `outbox probe ${suffix}`,
      body: "plain",
      html: "<p>plain</p>",
      kind: "test.probe",
      attempts: overrides.attempts ?? 0,
      sentAt: overrides.sentAt ?? null,
      error: overrides.error ?? null,
    },
  });
}

describe("PATCH /api/admin/outbox/[id] (retry + resend)", () => {
  test("401 without a session (missing CSRF header fails the guard)", async () => {
    setCookie(undefined);
    const row = await seedOutbox();
    const res = await PATCH(jsonRequest(url(row.id), { action: "retry" }), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(res.status).toBe(401);
  });

  test("403 for ADMISSIONS (finance module is ADMIN/FINANCE only)", async () => {
    setCookie(admissionsSession.cookieValue);
    const row = await seedOutbox();
    const res = await call(row.id, { action: "retry" }, admissionsSession.csrfToken);
    expect(res.status).toBe(403);
  });

  test("404 for an unknown outbox id", async () => {
    setCookie(financeSession.cookieValue);
    const res = await call("no-such-outbox-row", { action: "retry" }, financeSession.csrfToken);
    expect(res.status).toBe(404);
  });

  test("400 for an action outside the enum", async () => {
    setCookie(financeSession.cookieValue);
    const row = await seedOutbox();
    const res = await call(row.id, { action: "explode" }, financeSession.csrfToken);
    expect(res.status).toBe(400);
  });

  test("retry on a queued log-driver row delivers now — attempts 0→1, sentAt set", async () => {
    setCookie(financeSession.cookieValue);
    const row = await seedOutbox(); // log-driver queue shape: unsent, no error
    const res = await call(row.id, { action: "retry" }, financeSession.csrfToken);
    expect(res.status).toBe(200);

    const json = (await res.json()) as { ok: boolean; data: { email: { attempts: number; sentAt: string | null; error: string | null } } };
    expect(json.ok).toBe(true);
    expect(json.data.email.attempts).toBe(1);
    expect(json.data.email.sentAt).not.toBeNull(); // delivered = logged under the log driver
    expect(json.data.email.error).toBeNull();

    const after = await db.outboxEmail.findUniqueOrThrow({ where: { id: row.id } });
    expect(after.attempts).toBe(1);
    expect(after.sentAt).not.toBeNull();
    expect(after.error).toBeNull();

    // the manual retry is audited (outbox.retry, before/after diff)
    const entry = await db.auditLog.findFirstOrThrow({
      where: { action: "outbox.retry", entity: "OutboxEmail", entityId: row.id },
      orderBy: { createdAt: "desc" },
    });
    expect(entry.actorId).not.toBeNull();
  });

  test("retry on a failed row (attempts 1, error set) clears the error and increments", async () => {
    setCookie(financeSession.cookieValue);
    const row = await seedOutbox({ attempts: 1, error: "smtp transporter unavailable" });
    const res = await call(row.id, { action: "retry" }, financeSession.csrfToken);
    expect(res.status).toBe(200);

    const after = await db.outboxEmail.findUniqueOrThrow({ where: { id: row.id } });
    expect(after.attempts).toBe(2);
    expect(after.sentAt).not.toBeNull();
    expect(after.error).toBeNull();
  });

  test("resend keeps queue-only semantics — sentAt/error cleared, attempts untouched", async () => {
    setCookie(financeSession.cookieValue);
    const row = await seedOutbox({ attempts: 2, sentAt: new Date() });
    const res = await call(row.id, { action: "resend" }, financeSession.csrfToken);
    expect(res.status).toBe(200);

    const json = (await res.json()) as { ok: boolean; data: { queued: boolean } };
    expect(json.ok).toBe(true);
    expect(json.data.queued).toBe(true);

    const after = await db.outboxEmail.findUniqueOrThrow({ where: { id: row.id } });
    expect(after.sentAt).toBeNull();
    expect(after.error).toBeNull();
    expect(after.attempts).toBe(2); // resend never counts as a delivery attempt

    // the re-queue is audited with the original action key
    const entry = await db.auditLog.findFirst({
      where: { action: "outbox.resend", entity: "OutboxEmail", entityId: row.id },
      orderBy: { createdAt: "desc" },
    });
    expect(entry).not.toBeNull();
  });
});
