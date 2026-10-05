import { describe, test, expect, beforeAll } from "bun:test";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Donation money-loop at the handler level: the REAL POST /api/donations and
 * POST /api/donations/callback route handlers are invoked in-process (no
 * server, no browser). Signatures are computed with the re-implementation of
 * the documented HMAC contract (see tests/unit/crypto.test.ts), so these
 * tests also pin the route's signing behaviour to the contract.
 *
 * NOTE on POST count: /api/donations is rate-limited at 5/min per IP, and the
 * limiter is in-memory — this file makes exactly 5 POST invocations.
 */

process.env.PAYMENT_PROVIDER ??= "sandbox";
process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";
process.env.PAYMENT_CALLBACK_SECRET ??= "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8";

const callbackSecret = () => process.env.PAYMENT_CALLBACK_SECRET ?? "";

function callbackSignature(
  trackingCode: string,
  status: "COMPLETED" | "FAILED",
  providerTxnId: string | null,
  ts: number,
): string {
  return createHmac("sha256", callbackSecret())
    .update(`${trackingCode}|${status}|${providerTxnId ?? ""}|${ts}`)
    .digest("hex");
}

/** Round 3: callback bodies carry a fresh epoch-ms timestamp (±15 min window). */
function nowTs(): number {
  return Date.now();
}

const { POST } = await import("@/app/api/donations/route");
const { POST: CALLBACK } = await import("@/app/api/donations/callback/route");

const postUrl = "http://localhost:3000/api/donations";
const callbackUrl = "http://localhost:3000/api/donations/callback";

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const donorBody = (suffix: string) => ({
  fundType: "general",
  amount: 1500,
  donorName: `দাতা ${suffix}`,
  email: `donor-${suffix}@example.com`,
  phone: "01712345678",
  message: "সদকা হিসেবে দিলাম",
});

interface DonationResponse {
  data: {
    receiptNo: string;
    trackingCode: string;
    message: string;
    paymentInfo: { bkash: string; nagad: string; rocket: string; bank: string };
    checkoutUrl: string | null;
  };
}

/** Tracking codes captured from THIS file's POSTs (other suites create donations too). */
let tracking1 = "";
let tracking2 = "";

beforeAll(async () => {
  await db.fund.create({
    data: { key: "general", nameBn: "সাধারণ ফান্ড", nameEn: "General Fund" },
  });
});

describe("POST /api/donations (intent + payment instructions)", () => {
  let first: DonationResponse;

  test("201 records a PENDING donation with codes, checkout grant and an initiated transaction", async () => {
    const res = await POST(jsonRequest(postUrl, donorBody("one")));
    expect(res.status).toBe(201);
    first = (await res.json()) as DonationResponse;

    expect(first.data.receiptNo).toMatch(/^ASDRI-R-\d{6}$/);
    expect(first.data.trackingCode).toMatch(/^DN-\d{4}-\d{6}$/);
    expect(first.data.message).toContain("আলহামদুলিল্লাহ");
    expect(first.data.paymentInfo.bkash.length).toBeGreaterThan(0);
    expect(first.data.paymentInfo.bank).toBeTruthy();

    // Round 3: the sandbox checkout grant is an expiring signed link —
    // sig = HMAC(secret, `${code}|${exp}`), exp = epoch seconds (24h TTL).
    const grantMatch = /^\/checkout\/(DN-\d{4}-\d{6})\?sig=([0-9a-f]{64})&exp=(\d{10})$/.exec(
      first.data.checkoutUrl ?? "",
    );
    expect(grantMatch).not.toBeNull();
    if (grantMatch) {
      const [, code, sig, exp] = grantMatch;
      expect(code).toBe(first.data.trackingCode);
      const expectedSig = createHmac("sha256", callbackSecret()).update(`${code}|${exp}`).digest("hex");
      expect(sig).toBe(expectedSig);
      expect(Number(exp) * 1000).toBeGreaterThan(Date.now()); // not already expired
      expect(Number(exp) * 1000).toBeLessThanOrEqual(Date.now() + 24 * 3600 * 1000 + 5000);
    }

    const donation = await db.donation.findUniqueOrThrow({
      where: { trackingCode: first.data.trackingCode },
      include: { transactions: true, fund: true },
    });
    expect(donation.status).toBe("PENDING");
    tracking1 = first.data.trackingCode;
    expect(donation.receiptNo).toBe(first.data.receiptNo);
    expect(donation.amount).toBe(1500);
    expect(donation.donorEmail).toBe("donor-one@example.com");
    expect(donation.isAnonymous).toBe(false);
    expect(donation.fund.key).toBe("general");
    expect(donation.paidAt).toBeNull();
    expect(donation.transactions).toHaveLength(1);
    expect(donation.transactions[0].event).toBe("initiated");
    expect((donation.transactions[0].rawPayload as Record<string, unknown>).recurring).toBe(false);
  });

  test("400 with per-field Bengali errors when the amount is below the minimum", async () => {
    const res = await POST(jsonRequest(postUrl, { ...donorBody("v"), amount: 5 }));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string; code: string; fields?: Record<string, string> };
    expect(json.code).toBe("VALIDATION");
    expect(json.fields?.amount).toBe("সর্বনিম্ন ১০ টাকা");
  });

  test("400 for a fundType outside the enum", async () => {
    const res = await POST(jsonRequest(postUrl, { ...donorBody("v"), fundType: "gold" }));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { fields?: Record<string, string> };
    expect(json.fields?.fundType).toBeTruthy();
  });

  test("400 when the fund key does not exist (or is disabled)", async () => {
    const res = await POST(jsonRequest(postUrl, { ...donorBody("v"), fundType: "zakat" }));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { code: string; fields?: Record<string, string> };
    expect(json.code).toBe("VALIDATION");
    expect(json.fields?.fundType).toContain("ফান্ডটি");
  });

  test("second valid donation (for the FAILED path below)", async () => {
    const res = await POST(jsonRequest(postUrl, donorBody("two")));
    expect(res.status).toBe(201);
    const json = (await res.json()) as DonationResponse;
    expect(json.data.trackingCode).not.toBe(first.data.trackingCode);
    expect(json.data.receiptNo).not.toBe(first.data.receiptNo);
    tracking2 = json.data.trackingCode;
  });
});

describe("POST /api/donations/callback (signed gateway callback)", () => {
  let donation1: { id: string; trackingCode: string };
  let donation2: { id: string; trackingCode: string };

  beforeAll(async () => {
    donation1 = await db.donation.findUniqueOrThrow({ where: { trackingCode: tracking1 } });
    donation2 = await db.donation.findUniqueOrThrow({ where: { trackingCode: tracking2 } });
  });

  test("a bad signature is rejected with 403 and leaves the donation PENDING (audit trail kept)", async () => {
    const res = await CALLBACK(
      jsonRequest(callbackUrl, {
        trackingCode: donation1.trackingCode,
        status: "COMPLETED",
        providerTxnId: "TXN-EVIL",
        ts: nowTs(),
        signature: "0".repeat(64),
      }),
    );
    expect(res.status).toBe(403);

    const donation = await db.donation.findUniqueOrThrow({
      where: { id: donation1.id },
      include: { transactions: true },
    });
    expect(donation.status).toBe("PENDING");
    expect(donation.paidAt).toBeNull();
    const badCallback = donation.transactions.find((t) => t.event === "callback");
    expect(badCallback?.signatureValid).toBe(false);
    expect((badCallback?.rawPayload as Record<string, unknown>).reason).toBe("invalid-signature");
  });

  test("a correctly-signed COMPLETED callback completes the donation and queues the receipt email", async () => {
    const res = await CALLBACK(
      jsonRequest(callbackUrl, {
        trackingCode: donation1.trackingCode,
        status: "COMPLETED",
        providerTxnId: "TXN-GOOD-1",
        ts: nowTs(),
        signature: callbackSignature(donation1.trackingCode, "COMPLETED", "TXN-GOOD-1", nowTs()),
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { status: string } };
    expect(json.data.status).toBe("COMPLETED");

    const donation = await db.donation.findUniqueOrThrow({
      where: { id: donation1.id },
      include: { transactions: true },
    });
    expect(donation.status).toBe("COMPLETED");
    expect(donation.paidAt).not.toBeNull();
    expect(donation.providerTxnId).toBe("TXN-GOOD-1");
    const verified = donation.transactions.find((t) => t.event === "verified");
    expect(verified?.signatureValid).toBe(true);
    expect(donation.receiptSentAt).not.toBeNull();

    // Scoped to this donor: other suites (payments-security) queue receipts too.
    const outbox = await db.outboxEmail.findMany({
      where: { kind: "donation.receipt", to: { in: ["donor-one@example.com", "donor-two@example.com"] } },
    });
    expect(outbox).toHaveLength(1);
    expect(outbox[0].to).toBe("donor-one@example.com");
    expect(outbox[0].subject).toContain(donation.receiptNo ?? "");
    expect(outbox[0].sentAt).toBeNull(); // log driver: queued, inspectable, re-sendable
  });

  test("re-delivering the same callback is idempotent — no double receipt, no double event", async () => {
    const before = await db.paymentTransaction.count({ where: { donationId: donation1.id } });
    const res = await CALLBACK(
      jsonRequest(callbackUrl, {
        trackingCode: donation1.trackingCode,
        status: "COMPLETED",
        providerTxnId: "TXN-GOOD-1",
        ts: nowTs(),
        signature: callbackSignature(donation1.trackingCode, "COMPLETED", "TXN-GOOD-1", nowTs()),
      }),
    );
    expect(res.status).toBe(200);

    const after = await db.paymentTransaction.count({ where: { donationId: donation1.id } });
    expect(after).toBe(before);
    expect(
      await db.outboxEmail.count({
        where: { kind: "donation.receipt", to: { in: ["donor-one@example.com", "donor-two@example.com"] } },
      }),
    ).toBe(1);
  });

  test("a late FAILED callback never downgrades a COMPLETED donation", async () => {
    const res = await CALLBACK(
      jsonRequest(callbackUrl, {
        trackingCode: donation1.trackingCode,
        status: "FAILED",
        providerTxnId: "TXN-LATE-FAIL",
        ts: nowTs(),
        signature: callbackSignature(donation1.trackingCode, "FAILED", "TXN-LATE-FAIL", nowTs()),
      }),
    );
    expect(res.status).toBe(200);

    const donation = await db.donation.findUniqueOrThrow({ where: { id: donation1.id } });
    expect(donation.status).toBe("COMPLETED");
    const failedEvents = await db.paymentTransaction.findMany({
      where: { donationId: donation1.id, event: "failed" },
    });
    expect(failedEvents).toHaveLength(0);
  });

  test("unknown tracking code → 404", async () => {
    const unknown = "DN-2026-999999";
    const res = await CALLBACK(
      jsonRequest(callbackUrl, {
        trackingCode: unknown,
        status: "COMPLETED",
        ts: nowTs(),
        signature: callbackSignature(unknown, "COMPLETED", null, nowTs()),
      }),
    );
    expect(res.status).toBe(404);
  });

  test("a signed FAILED callback marks a PENDING donation FAILED with a trail event", async () => {
    const res = await CALLBACK(
      jsonRequest(callbackUrl, {
        trackingCode: donation2.trackingCode,
        status: "FAILED",
        providerTxnId: "TXN-FAIL-2",
        ts: nowTs(),
        signature: callbackSignature(donation2.trackingCode, "FAILED", "TXN-FAIL-2", nowTs()),
      }),
    );
    expect(res.status).toBe(200);

    const donation = await db.donation.findUniqueOrThrow({
      where: { id: donation2.id },
      include: { transactions: true },
    });
    expect(donation.status).toBe("FAILED");
    expect(donation.providerTxnId).toBe("TXN-FAIL-2");
    expect(donation.paidAt).toBeNull();
    const failed = donation.transactions.find((t) => t.event === "failed");
    expect(failed?.signatureValid).toBe(true);
  });

  test("a later signed COMPLETED callback recovers a FAILED donation (only COMPLETED is terminal)", async () => {
    const res = await CALLBACK(
      jsonRequest(callbackUrl, {
        trackingCode: donation2.trackingCode,
        status: "COMPLETED",
        providerTxnId: "TXN-RETRY-2",
        ts: nowTs(),
        signature: callbackSignature(donation2.trackingCode, "COMPLETED", "TXN-RETRY-2", nowTs()),
      }),
    );
    expect(res.status).toBe(200);

    const donation = await db.donation.findUniqueOrThrow({ where: { id: donation2.id } });
    expect(donation.status).toBe("COMPLETED");
    expect(donation.paidAt).not.toBeNull();
    // the second donor's receipt is queued as well
    const outbox = await db.outboxEmail.findMany({
      where: { kind: "donation.receipt", to: { in: ["donor-one@example.com", "donor-two@example.com"] } },
    });
    expect(outbox).toHaveLength(2);
    expect(outbox.map((o) => o.to).sort()).toEqual(["donor-one@example.com", "donor-two@example.com"].sort());
  });
});
