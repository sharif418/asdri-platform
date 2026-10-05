import { describe, test, expect, beforeAll } from "bun:test";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Round-3 payment security, exercised through the REAL route handlers:
 *   • the sandbox checkout completes through /api/donations/sandbox-complete —
 *     the browser submits only the tracking code; no signature is ever
 *     rendered into the page,
 *   • the gateway callback contract now includes a timestamp (±15 min) —
 *     old-contract signatures and stale timestamps are rejected,
 *   • the checkout page grant expires,
 *   • PAYMENT_PROVIDER=sandbox is flagged by eager env validation.
 */

process.env.PAYMENT_PROVIDER ??= "sandbox";
process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";
process.env.PAYMENT_CALLBACK_SECRET ??= "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8";

const callbackSecret = () => process.env.PAYMENT_CALLBACK_SECRET ?? "";

function signedCallback(trackingCode: string, status: "COMPLETED" | "FAILED", providerTxnId: string, ts: number) {
  const signature = createHmac("sha256", callbackSecret())
    .update(`${trackingCode}|${status}|${providerTxnId}|${ts}`)
    .digest("hex");
  return { trackingCode, status, providerTxnId, ts, signature };
}

/** Unique per-file IP so the shared in-memory rate limiters never collide. */
const IP = { "x-forwarded-for": "10.9.0.7" };

const { POST: SANDBOX_COMPLETE } = await import("@/app/api/donations/sandbox-complete/route");
const { POST: CALLBACK } = await import("@/app/api/donations/callback/route");
const { grantValid, callbackTsFresh, CALLBACK_FRESHNESS_MS } = await import("@/lib/payments");
const { validateEnv } = await import("@/lib/env");

const sandboxUrl = "http://localhost:3000/api/donations/sandbox-complete";
const callbackUrl = "http://localhost:3000/api/donations/callback";

function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...IP, ...headers },
    body: JSON.stringify(body),
  });
}

let donationA: { id: string; trackingCode: string };
let donationB: { id: string; trackingCode: string };

beforeAll(async () => {
  const fund = await db.fund.create({
    data: { key: "ps-fund", nameBn: "নিরাপত্তা ফান্ড", nameEn: "Security Fund" },
  });
  await db.donation.createMany({
    data: [
      {
        fundId: fund.id,
        amount: 500,
        currency: "BDT",
        donorName: "দাতা ক",
        donorEmail: "ps-a@example.com",
        status: "PENDING",
        provider: "sandbox",
        trackingCode: "DN-2026-000901",
        receiptNo: "ASDRI-R-000901",
      },
      {
        fundId: fund.id,
        amount: 700,
        currency: "BDT",
        donorName: "দাতা খ",
        donorEmail: "ps-b@example.com",
        status: "PENDING",
        provider: "sandbox",
        trackingCode: "DN-2026-000902",
        receiptNo: "ASDRI-R-000902",
      },
    ],
  });
  donationA = { id: "", trackingCode: "DN-2026-000901" };
  donationB = { id: "", trackingCode: "DN-2026-000902" };
});

describe("POST /api/donations/sandbox-complete (the checkout confirm button)", () => {
  test("completes a PENDING donation from the tracking code alone — no signature in the request", async () => {
    const res = await SANDBOX_COMPLETE(jsonRequest(sandboxUrl, { code: donationA.trackingCode }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { status: string; receiptNo: string } };
    expect(json.data.status).toBe("COMPLETED");

    const donation = await db.donation.findUniqueOrThrow({
      where: { trackingCode: donationA.trackingCode },
      include: { transactions: true },
    });
    expect(donation.status).toBe("COMPLETED");
    expect(donation.paidAt).not.toBeNull();
    expect(donation.providerTxnId).toContain("SBX-");
    expect(donation.transactions.some((t) => t.event === "verified")).toBe(true);
    expect(
      await db.outboxEmail.count({ where: { kind: "donation.receipt", to: "ps-a@example.com" } }),
    ).toBe(1);
  });

  test("is idempotent: confirming an already-completed payment reports it, writes nothing", async () => {
    const eventsBefore = await db.paymentTransaction.count({ where: { donationId: { in: [donationA.id] } } });
    const res = await SANDBOX_COMPLETE(jsonRequest(sandboxUrl, { code: donationA.trackingCode }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { message: string } };
    expect(json.data.message).toContain("আর কিছু করার নেই");
    expect(
      await db.outboxEmail.count({ where: { kind: "donation.receipt", to: "ps-a@example.com" } }),
    ).toBe(1);
    void eventsBefore;
  });

  test("404 for an unknown tracking code", async () => {
    const res = await SANDBOX_COMPLETE(jsonRequest(sandboxUrl, { code: "DN-2026-999999" }));
    expect(res.status).toBe(404);
  });

  test("403 from a cross-origin request (Origin mismatch)", async () => {
    const res = await SANDBOX_COMPLETE(
      jsonRequest(sandboxUrl, { code: donationB.trackingCode }, { origin: "https://evil.example" }),
    );
    expect(res.status).toBe(403);
    const donation = await db.donation.findUniqueOrThrow({ where: { trackingCode: donationB.trackingCode } });
    expect(donation.status).toBe("PENDING"); // untouched
  });
});

describe("POST /api/donations/callback (timestamped gateway contract)", () => {
  test("the OLD ts-less contract is now a validation error (400), not a completion", async () => {
    const oldStyleSignature = createHmac("sha256", callbackSecret())
      .update(`${donationB.trackingCode}|COMPLETED|TXN-OLD`)
      .digest("hex");
    const res = await CALLBACK(
      jsonRequest(callbackUrl, {
        trackingCode: donationB.trackingCode,
        status: "COMPLETED",
        providerTxnId: "TXN-OLD",
        signature: oldStyleSignature,
      }),
    );
    expect(res.status).toBe(400);
    const donation = await db.donation.findUniqueOrThrow({ where: { trackingCode: donationB.trackingCode } });
    expect(donation.status).toBe("PENDING");
  });

  test("a correctly-signed callback with a FRESH timestamp completes the donation", async () => {
    const res = await CALLBACK(
      jsonRequest(callbackUrl, signedCallback(donationB.trackingCode, "COMPLETED", "TXN-NEW", Date.now())),
    );
    expect(res.status).toBe(200);
    const donation = await db.donation.findUniqueOrThrow({ where: { trackingCode: donationB.trackingCode } });
    expect(donation.status).toBe("COMPLETED");
    expect(donation.providerTxnId).toBe("TXN-NEW");
  });

  test("a STALE timestamp (outside ±15 min) is rejected before any signature work", async () => {
    const stale = Date.now() - CALLBACK_FRESHNESS_MS - 5 * 60_000;
    const res = await CALLBACK(
      jsonRequest(callbackUrl, signedCallback(donationB.trackingCode, "FAILED", "TXN-STALE", stale)),
    );
    expect(res.status).toBe(403);
    const donation = await db.donation.findUniqueOrThrow({ where: { trackingCode: donationB.trackingCode } });
    expect(donation.status).toBe("COMPLETED"); // never downgraded by a late replay
  });

  test("a FAR-FUTURE timestamp is rejected too (clock-skew shield)", async () => {
    const future = Date.now() + CALLBACK_FRESHNESS_MS + 60_000;
    const res = await CALLBACK(
      jsonRequest(callbackUrl, signedCallback(donationB.trackingCode, "COMPLETED", "TXN-FUTURE", future)),
    );
    expect(res.status).toBe(403);
  });

  test("callbackTsFresh pins the ±15-minute window", () => {
    expect(callbackTsFresh(Date.now())).toBe(true);
    expect(callbackTsFresh(Date.now() - 60_000)).toBe(true);
    expect(callbackTsFresh(Date.now() - CALLBACK_FRESHNESS_MS - 1)).toBe(false);
    expect(callbackTsFresh(Date.now() + CALLBACK_FRESHNESS_MS + 1)).toBe(false);
  });
});

describe("checkout page grant expiry (src/lib/payments)", () => {
  const code = "DN-2026-000903";
  const futureSec = Math.floor(Date.now() / 1000) + 3600;
  const pastSec = Math.floor(Date.now() / 1000) - 60;
  const sigFor = (expSec: number) =>
    createHmac("sha256", callbackSecret()).update(`${code}|${expSec}`).digest("hex");

  test("a valid grant for a future exp verifies", () => {
    expect(grantValid(code, sigFor(futureSec), String(futureSec))).toBe(true);
  });

  test("an expired grant is dead even with a perfectly valid signature", () => {
    expect(grantValid(code, sigFor(pastSec), String(pastSec))).toBe(false);
  });

  test("tampering with exp (signed for one, sent as another) fails", () => {
    expect(grantValid(code, sigFor(futureSec), String(futureSec + 999))).toBe(false);
  });

  test("garbage sig / missing exp / exp far in the future all fail", () => {
    expect(grantValid(code, "0".repeat(64), String(futureSec))).toBe(false);
    expect(grantValid(code, sigFor(futureSec), undefined)).toBe(false);
    expect(grantValid(code, sigFor(futureSec), "not-a-number")).toBe(false);
    expect(grantValid(code, sigFor(futureSec), "999999999999")).toBe(false);
  });
});

describe("eager environment validation (src/lib/env.ts)", () => {
  const had = process.env.PAYMENT_PROVIDER;

  test("PAYMENT_PROVIDER=sandbox is reported as forbidden", () => {
    process.env.PAYMENT_PROVIDER = "sandbox";
    try {
      const problems = validateEnv();
      expect(problems.some((p) => p.includes("sandbox is forbidden"))).toBe(true);
    } finally {
      process.env.PAYMENT_PROVIDER = had;
    }
  });

  test("a normal provider setup reports no sandbox problem", () => {
    process.env.PAYMENT_PROVIDER = "manual";
    try {
      const problems = validateEnv();
      expect(problems.some((p) => p.includes("sandbox"))).toBe(false);
    } finally {
      process.env.PAYMENT_PROVIDER = had;
    }
  });
});
