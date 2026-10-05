import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma, type Donation } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { buildDonationReceiptEmail, queueOutboxEmail } from "@/lib/mail";

/**
 * Payment signing + completion — the single implementation both the sandbox
 * checkout route and the (future real-gateway) callback route share.
 *
 * Contracts (round 3 hardening):
 *   page grant   sig = hex HMAC-SHA256(secret, `${code}|${exp}`) — exp = epoch
 *                seconds; the checkout link dies with the grant (24h TTL).
 *   callback     sig = hex HMAC-SHA256(secret,
 *                `${trackingCode}|${status}|${providerTxnId ?? ""}|${ts}`)
 *                with ts = epoch ms and ±CALLBACK_FRESHNESS_MS freshness, so a
 *                captured callback cannot be replayed later.
 * The sandbox provider is dev/demo only: production refuses to boot with
 * PAYMENT_PROVIDER=sandbox (see env.ts) and the sandbox routes 404 unless the
 * provider is explicitly sandbox.
 */

export const CALLBACK_FRESHNESS_MS = 15 * 60 * 1000; // ±15 minutes around "now"
export const CHECKOUT_GRANT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type CallbackStatus = "COMPLETED" | "FAILED";

/** True only when the sandbox provider is explicitly selected (dev/demo). */
export function isSandboxProvider(): boolean {
  return env.paymentProvider === "sandbox";
}

/* ————————————— signatures ————————————— */

/** Timing-safe comparison of two hex strings (length must match). */
export function timingSafeHexEqual(expected: string, given: string): boolean {
  const a = Buffer.from(expected.toLowerCase(), "utf8");
  const b = Buffer.from(given.toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Page-grant signature over `code|exp` (exp = epoch seconds, string form). */
export function grantSignature(code: string, expSec: number): string {
  return createHmac("sha256", env.paymentCallbackSecret).update(`${code}|${expSec}`).digest("hex");
}

/** Mint the signed, expiring checkout link for a PENDING donation. */
export function buildCheckoutUrl(trackingCode: string, createdAt: Date): string {
  const expSec = Math.floor((createdAt.getTime() + CHECKOUT_GRANT_TTL_MS) / 1000);
  return `/checkout/${trackingCode}?sig=${grantSignature(trackingCode, expSec)}&exp=${expSec}`;
}

/** Verify a checkout page grant (sig over `code|exp`) including expiry. */
export function grantValid(code: string, sig: string | undefined, exp: string | undefined): boolean {
  if (!sig || !/^[0-9a-fA-F]{64}$/.test(sig)) return false;
  if (!exp || !/^\d{1,12}$/.test(exp)) return false;
  const expSec = Number(exp);
  if (expSec * 1000 <= Date.now()) return false; // expired grants never open the page
  return timingSafeHexEqual(grantSignature(code, expSec), sig);
}

/** Canonical callback signing input — ts (epoch ms) included since round 3. */
export function callbackCanonical(
  trackingCode: string,
  status: CallbackStatus,
  providerTxnId: string | null,
  ts: number,
): string {
  return `${trackingCode}|${status}|${providerTxnId ?? ""}|${ts}`;
}

export function callbackSignature(
  trackingCode: string,
  status: CallbackStatus,
  providerTxnId: string | null,
  ts: number,
): string {
  return createHmac("sha256", env.paymentCallbackSecret)
    .update(callbackCanonical(trackingCode, status, providerTxnId, ts))
    .digest("hex");
}

/** Freshness window check for callback timestamps (±15 min). */
export function callbackTsFresh(ts: number): boolean {
  const skew = Math.abs(Date.now() - ts);
  return skew <= CALLBACK_FRESHNESS_MS;
}

/* ————————————— shared state machine ————————————— */

export interface CompletionResult {
  alreadyCompleted: boolean;
  receiptQueued: boolean;
}

/**
 * Complete a PENDING donation: atomically claim the transition (concurrent
 * callbacks cannot double-complete or double-send the receipt), record the
 * `verified` PaymentTransaction and queue the receipt email to the outbox.
 */
export async function completeDonation(
  donation: Donation & { fund: { nameBn: string; nameEn: string } },
  providerTxnId: string | null,
  rawPayload: Record<string, unknown>,
): Promise<CompletionResult> {
  const claimed = await db.donation.updateMany({
    where: { id: donation.id, status: { not: "COMPLETED" } },
    data: { status: "COMPLETED", paidAt: new Date(), providerTxnId },
  });
  if (claimed.count === 0) {
    return { alreadyCompleted: true, receiptQueued: false };
  }

  await db.paymentTransaction.create({
    data: {
      donationId: donation.id,
      provider: donation.provider,
      event: "verified",
      signatureValid: true,
      rawPayload: rawPayload as Prisma.InputJsonValue,
    },
  });

  let receiptQueued = false;
  if (donation.donorEmail) {
    await queueOutboxEmail(
      buildDonationReceiptEmail({
        to: donation.donorEmail,
        receiptNo: donation.receiptNo ?? donation.trackingCode,
        trackingCode: donation.trackingCode,
        fundName: donation.fund.nameEn || donation.fund.nameBn,
        amount: donation.amount,
        currency: donation.currency,
        donorName: donation.donorName,
        paidAt: new Date(),
      }),
    );
    await db.donation.update({ where: { id: donation.id }, data: { receiptSentAt: new Date() } });
    receiptQueued = true;
  }

  return { alreadyCompleted: false, receiptQueued };
}

/**
 * Mark a PENDING donation FAILED. A completed donation is never downgraded by
 * a late failure callback.
 */
export async function failDonation(
  donation: Donation,
  providerTxnId: string | null,
  rawPayload: Record<string, unknown>,
): Promise<boolean> {
  const claimed = await db.donation.updateMany({
    where: { id: donation.id, status: "PENDING" },
    data: { status: "FAILED", providerTxnId },
  });
  if (claimed.count === 0) return false;

  await db.paymentTransaction.create({
    data: {
      donationId: donation.id,
      provider: donation.provider,
      event: "failed",
      signatureValid: true,
      rawPayload: rawPayload as Prisma.InputJsonValue,
    },
  });
  return true;
}
