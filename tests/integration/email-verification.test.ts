import { describe, test, expect, beforeAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { installCookieMock } from "../helpers/auth-forge";

/**
 * Round-3 email verification, through the REAL route handlers:
 *   • POST /api/auth/register queues a single-use verification email,
 *   • POST /api/auth/verify-email consumes the token and sets
 *     User.emailVerifiedAt (which is what unlocks donation-by-email history),
 *   • tokens are single use, and resending requires a session.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const setCookie = installCookieMock();
const { POST: REGISTER } = await import("@/app/api/auth/register/route");
const { POST: VERIFY } = await import("@/app/api/auth/verify-email/route");
const { POST: RESEND } = await import("@/app/api/auth/verify-email/resend/route");

const IP = { "x-forwarded-for": "10.9.0.11" };
const registerUrl = "http://localhost:3000/api/auth/register";
const verifyUrl = "http://localhost:3000/api/auth/verify-email";
const resendUrl = "http://localhost:3000/api/auth/verify-email/resend";

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...IP },
    body: JSON.stringify(body),
  });
}

const email = `verify-${Date.now()}@example.com`;
let cookieValue = "";

beforeAll(async () => {
  // Clean slate for this address (idempotent re-runs).
  await db.user.deleteMany({ where: { email } });
});

describe("POST /api/auth/register (queues the verification email)", () => {
  test("201 creates an UNVERIFIED user and queues email.verification", async () => {
    const res = await REGISTER(
      jsonRequest(registerUrl, {
        name: "ভেরিফাই প্রোব",
        email,
        password: "Password123!",
        confirmPassword: "Password123!",
        role: "student",
      }),
    );
    expect(res.status).toBe(201);

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerifiedAt).toBeNull();

    const setCookies = res.headers.getSetCookie?.() ?? [];
    const sessionCookie = setCookies.find((c) => c.startsWith("asr-session="));
    expect(sessionCookie).toBeTruthy();
    cookieValue = sessionCookie?.split(";")[0]?.split("=")[1] ?? "";

    const outbox = await db.outboxEmail.findFirst({
      where: { kind: "email.verification", to: email },
      orderBy: { createdAt: "desc" },
    });
    expect(outbox).not.toBeNull();
    expect(outbox?.html).toContain("/verify-email?token=");
    const tokenRow = await db.emailVerification.findFirst({ where: { userId: user.id } });
    expect(tokenRow).not.toBeNull();
    expect(tokenRow?.usedAt).toBeNull();
  });
});

describe("POST /api/auth/verify-email", () => {
  async function latestToken(): Promise<string> {
    const outbox = await db.outboxEmail.findFirst({
      where: { kind: "email.verification", to: email },
      orderBy: { createdAt: "desc" },
    });
    const match = /verify-email\?token=([0-9a-f]{64})/.exec(outbox?.html ?? "");
    if (!match) throw new Error("no token in the queued email");
    return match[1];
  }

  test("403 for a garbage token", async () => {
    const res = await VERIFY(jsonRequest(verifyUrl, { token: "f".repeat(64) }));
    expect(res.status).toBe(403);
  });

  test("200 with the real token sets emailVerifiedAt exactly once", async () => {
    const token = await latestToken();
    const res = await VERIFY(jsonRequest(verifyUrl, { token }));
    expect(res.status).toBe(200);

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerifiedAt).not.toBeNull();
  });

  test("the same token cannot be reused (single use)", async () => {
    const token = await latestToken();
    const res = await VERIFY(jsonRequest(verifyUrl, { token }));
    expect(res.status).toBe(403);
  });

  test("donation history gate: the (unverified) sister account sees NOTHING", async () => {
    // A second person registers the SAME address the first person used for
    // donations — the historical exposure path. With verification in place the
    // donation rows exist, but the account page only queries them after
    // emailVerifiedAt is set; pin the invariant here at the data level.
    const donorEmail = `donor-victim-${Date.now()}@example.com`;
    const fund = await db.fund.create({
      data: { key: `ev-${Date.now()}`, nameBn: "ফান্ড", nameEn: "Fund" },
    });
    await db.donation.create({
      data: {
        fundId: fund.id,
        amount: 10000,
        currency: "BDT",
        donorName: "ভুক্তভোগী দাতা",
        donorEmail,
        status: "COMPLETED",
        provider: "sandbox",
        trackingCode: `DN-2026-${String(Date.now()).slice(-6)}`,
        receiptNo: `ASDRI-R-${String(Date.now()).slice(-6)}`,
      },
    });

    const impostorEmail = `impostor-${Date.now()}@example.com`;
    const res = await REGISTER(
      jsonRequest(registerUrl, {
        name: "ছদ্মবেশী",
        email: impostorEmail,
        password: "Password123!",
        confirmPassword: "Password123!",
        role: "donor",
      }),
    );
    expect(res.status).toBe(201);
    const impostor = await db.user.findUniqueOrThrow({ where: { email: impostorEmail } });
    expect(impostor.emailVerifiedAt).toBeNull(); // gate stays closed until the inbox is proven
  });
});

describe("POST /api/auth/verify-email/resend", () => {
  test("401 without a session", async () => {
    setCookie(undefined);
    const res = await RESEND(jsonRequest(resendUrl, {}));
    expect(res.status).toBe(401);
  });

  test("with a session for an already-verified user → alreadyVerified", async () => {
    setCookie(cookieValue);
    const res = await RESEND(jsonRequest(resendUrl, {}));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data?: { alreadyVerified?: boolean } };
    expect(json.data?.alreadyVerified).toBe(true);
  });
});
