import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { installCookieMock, jsonRequest, csrfJsonRequest } from "../helpers/auth-forge";

/**
 * Outbox retry — the admin's immediate redelivery attempt on
 * PATCH /api/admin/outbox/[id] with action:"retry", invoked in-process with
 * a forged session cookie + CSRF header (same code path the browser hits).
 *
 * The sandbox default driver is log, so a successful attempt marks the row
 * delivered (sentAt set) — the failure path is exercised by flipping
 * MAIL_DRIVER=smtp without SMTP_URL, which records the error instead.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const setCookie = installCookieMock();
const { PATCH } = await import("@/app/api/admin/outbox/[id]/route");

interface Session {
  cookieValue: string;
  csrfToken: string;
}

let adminSession: Session;
let financeSession: Session;
let editorSession: Session;

beforeAll(async () => {
  const suffix = `${Date.now()}`;
  const createUser = (email: string, role: "ADMIN" | "FINANCE" | "EDITOR") =>
    db.user.create({
      data: { email, name: `টেস্ট ${role}`, passwordHash: hashPassword("Password123!"), role },
    });

  const admin = await createUser(`outbox-admin-${suffix}@test.local`, "ADMIN");
  const finance = await createUser(`outbox-finance-${suffix}@test.local`, "FINANCE");
  const editor = await createUser(`outbox-editor-${suffix}@test.local`, "EDITOR");

  adminSession = await createSession(admin.id);
  financeSession = await createSession(finance.id);
  editorSession = await createSession(editor.id);
});

afterAll(async () => {
  // The donations suite asserts absolute outbox counts for its own donors
  // and file execution order is not guaranteed — never leave probe rows behind.
  await db.outboxEmail.deleteMany({ where: { to: "donor-retry@example.com" } });
});

const url = (id: string) => `http://localhost:3000/api/admin/outbox/${id}`;

const call = (id: string, body: unknown, csrfToken: string) =>
  PATCH(csrfJsonRequest(url(id), body, csrfToken), { params: Promise.resolve({ id }) });

/** A stored email row in a chosen state. */
async function seedOutboxEmail(state: {
  error?: string | null;
  sentAt?: Date | null;
  attempts?: number;
}): Promise<string> {
  const row = await db.outboxEmail.create({
    data: {
      to: "donor-retry@example.com",
      subject: "Donation Receipt ASDRI-R-000001 — As-Sunnah Institute",
      body: "plain body",
      html: "<p>html body</p>",
      kind: "donation.receipt",
      payload: { receiptNo: "ASDRI-R-000001" },
      sentAt: state.sentAt ?? null,
      error: state.error ?? null,
      attempts: state.attempts ?? 0,
    },
  });
  return row.id;
}

describe("PATCH /api/admin/outbox/[id] action=retry", () => {
  test("401 without a session (guard fails before any state change)", async () => {
    setCookie(undefined);
    const id = await seedOutboxEmail({ error: "smtp connection timeout", attempts: 1 });
    const res = await PATCH(jsonRequest(url(id), { action: "retry" }), {
      params: Promise.resolve({ id }),
    });
    expect(res.status).toBe(401);
  });

  test("403 for a staff role outside the finance module (EDITOR)", async () => {
    setCookie(editorSession.cookieValue);
    const id = await seedOutboxEmail({ error: "smtp connection timeout", attempts: 1 });
    const res = await call(id, { action: "retry" }, editorSession.csrfToken);
    expect(res.status).toBe(403);

    const row = await db.outboxEmail.findUniqueOrThrow({ where: { id } });
    expect(row.attempts).toBe(1); // untouched
  });

  test("retry on an error email delivers it: sentAt set, error cleared, attempts incremented, audited", async () => {
    setCookie(adminSession.cookieValue);
    const id = await seedOutboxEmail({ error: "smtp connection timeout", attempts: 1 });

    const res = await call(id, { action: "retry" }, adminSession.csrfToken);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; data: { sent: boolean; attempts: number; error: string | null } };
    expect(json.ok).toBe(true);
    expect(json.data.sent).toBe(true);
    expect(json.data.attempts).toBe(2);
    expect(json.data.error).toBeNull();

    const row = await db.outboxEmail.findUniqueOrThrow({ where: { id } });
    expect(row.sentAt).not.toBeNull();
    expect(row.error).toBeNull();
    expect(row.attempts).toBe(2);

    const auditRow = await db.auditLog.findFirst({ where: { action: "outbox.retry", entityId: id } });
    expect(auditRow?.actorId).not.toBeNull();
  });

  test("FINANCE (module owner) may retry as well", async () => {
    setCookie(financeSession.cookieValue);
    const id = await seedOutboxEmail({ attempts: 0 });
    const res = await call(id, { action: "retry" }, financeSession.csrfToken);
    expect(res.status).toBe(200);
    const row = await db.outboxEmail.findUniqueOrThrow({ where: { id } });
    expect(row.attempts).toBe(1);
  });

  test("retry is forbidden for an already-sent email (409, row untouched)", async () => {
    setCookie(adminSession.cookieValue);
    const id = await seedOutboxEmail({ sentAt: new Date(), attempts: 1 });
    const res = await call(id, { action: "retry" }, adminSession.csrfToken);
    expect(res.status).toBe(409);

    const row = await db.outboxEmail.findUniqueOrThrow({ where: { id } });
    expect(row.attempts).toBe(1);
    expect(row.sentAt).not.toBeNull();
  });

  test("a failed attempt (smtp driver without SMTP_URL) records the error and stays retryable", async () => {
    setCookie(adminSession.cookieValue);
    const id = await seedOutboxEmail({ error: "smtp connection timeout", attempts: 2 });

    const previousDriver = process.env.MAIL_DRIVER;
    const previousSmtpUrl = process.env.SMTP_URL;
    delete process.env.SMTP_URL;
    process.env.MAIL_DRIVER = "smtp";
    try {
      const res = await call(id, { action: "retry" }, adminSession.csrfToken);
      expect(res.status).toBe(200);
      const json = (await res.json()) as { ok: boolean; data: { sent: boolean; attempts: number; error: string | null } };
      expect(json.ok).toBe(true);
      expect(json.data.sent).toBe(false);
      expect(json.data.attempts).toBe(3);
      expect(json.data.error).toContain("SMTP_URL");

      const row = await db.outboxEmail.findUniqueOrThrow({ where: { id } });
      expect(row.sentAt).toBeNull();
      expect(row.attempts).toBe(3);
      expect(row.error).toContain("SMTP_URL");
    } finally {
      process.env.MAIL_DRIVER = previousDriver ?? "log";
      if (previousSmtpUrl !== undefined) process.env.SMTP_URL = previousSmtpUrl;
    }
  });
});

describe("PATCH /api/admin/outbox/[id] action=resend (existing semantics kept)", () => {
  test("resend re-queues a sent email: sentAt/error cleared, attempts untouched", async () => {
    setCookie(adminSession.cookieValue);
    const id = await seedOutboxEmail({ sentAt: new Date(), error: null, attempts: 1 });

    const res = await call(id, { action: "resend" }, adminSession.csrfToken);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; data: { queued: boolean } };
    expect(json.data.queued).toBe(true);

    const row = await db.outboxEmail.findUniqueOrThrow({ where: { id } });
    expect(row.sentAt).toBeNull();
    expect(row.error).toBeNull();
    expect(row.attempts).toBe(1);

    const auditRow = await db.auditLog.findFirst({ where: { action: "outbox.resend", entityId: id } });
    expect(auditRow?.actorId).not.toBeNull();
  });

  test("an unknown action is rejected with 400", async () => {
    setCookie(adminSession.cookieValue);
    const id = await seedOutboxEmail({});
    const res = await call(id, { action: "explode" }, adminSession.csrfToken);
    expect(res.status).toBe(400);
  });
});
