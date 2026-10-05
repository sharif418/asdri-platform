import { describe, test, expect } from "bun:test";
import { createHmac } from "node:crypto";

/**
 * NOTE (duplication): the callback + checkout signature functions live in
 * src/lib/payments.ts, which is not imported here on purpose — the
 * re-implementations below mirror the DOCUMENTED contract, and
 * tests/integration/donations.test.ts proves the routes agree with them by
 * invoking the real handlers, so a drift in either place fails a test.
 *
 * Round 3 contracts:
 *   callback sig = hex HMAC-SHA256(secret,
 *                 `${trackingCode}|${status}|${providerTxnId ?? ""}|${ts}`)
 *                 with ts = epoch ms, ±15-minute freshness enforced by the route.
 *   page grant  sig = hex HMAC-SHA256(secret, `${code}|${exp}`)
 *                 with exp = epoch seconds; the link dies with the grant (24h).
 */

const TEST_SECRET =
  "0f4a8b2c6d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a";

const FIXED_TS = 1_770_000_000_000; // a fixed epoch-ms for vector pinning

/** Contract: hex HMAC-SHA256(secret, `${trackingCode}|${status}|${providerTxnId ?? ""}|${ts}`). */
export function callbackSignature(
  secret: string,
  trackingCode: string,
  status: "COMPLETED" | "FAILED",
  providerTxnId: string | null,
  ts: number,
): string {
  const canonical = `${trackingCode}|${status}|${providerTxnId ?? ""}|${ts}`;
  return createHmac("sha256", secret).update(canonical).digest("hex");
}

/** Contract: hex HMAC-SHA256(secret, `${code}|${exp}`) — the /checkout page grant. */
export function checkoutGrantSignature(secret: string, trackingCode: string, expSec: number): string {
  return createHmac("sha256", secret).update(`${trackingCode}|${expSec}`).digest("hex");
}

describe("donation callback HMAC contract", () => {
  test("matches the pinned known vector (algorithm + canonical string)", () => {
    // Vector precomputed with node:crypto over the documented canonical string.
    expect(callbackSignature(TEST_SECRET, "DN-2026-000001", "COMPLETED", "TXN-ABC-123", FIXED_TS)).toBe(
      "6066c97eaf971b5a72da1be9e24cb513fd0c20fdb104a7e80cec74ee70d70287",
    );
  });

  test("null and empty providerTxnId produce the same (trailing pipe) canonical form", () => {
    expect(callbackSignature(TEST_SECRET, "DN-2026-000001", "FAILED", null, FIXED_TS)).toBe(
      callbackSignature(TEST_SECRET, "DN-2026-000001", "FAILED", "", FIXED_TS),
    );
  });

  test("status, tracking code and timestamp are all signed — flipping any flips the digest", () => {
    const base = callbackSignature(TEST_SECRET, "DN-2026-000001", "COMPLETED", null, FIXED_TS);
    expect(callbackSignature(TEST_SECRET, "DN-2026-000001", "FAILED", null, FIXED_TS)).not.toBe(base);
    expect(callbackSignature(TEST_SECRET, "DN-2026-000002", "COMPLETED", null, FIXED_TS)).not.toBe(base);
    expect(callbackSignature(TEST_SECRET, "DN-2026-000001", "COMPLETED", null, FIXED_TS + 1)).not.toBe(base);
    expect(callbackSignature("another-secret", "DN-2026-000001", "COMPLETED", null, FIXED_TS)).not.toBe(base);
  });

  test("the OLD (ts-less) contract's signature does NOT verify under the new contract", () => {
    const oldStyle = createHmac("sha256", TEST_SECRET)
      .update("DN-2026-000001|COMPLETED|TXN-OLD")
      .digest("hex");
    const newStyle = callbackSignature(TEST_SECRET, "DN-2026-000001", "COMPLETED", "TXN-OLD", FIXED_TS);
    expect(oldStyle).not.toBe(newStyle);
  });

  test("signature is 64 lowercase hex characters (matches paymentCallbackSchema)", () => {
    const sig = callbackSignature(TEST_SECRET, "DN-2026-000001", "COMPLETED", "T1", FIXED_TS);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("checkout page grant HMAC contract", () => {
  const expSec = Math.floor(Date.now() / 1000) + 3600;

  test("signs `code|exp`, and the expiry participates in the digest", () => {
    expect(checkoutGrantSignature(TEST_SECRET, "DN-2026-000001", expSec)).not.toBe(
      checkoutGrantSignature(TEST_SECRET, "DN-2026-000001", expSec + 1),
    );
  });

  test("the page grant differs from the callback signature for the same code (narrower input)", () => {
    const grant = checkoutGrantSignature(TEST_SECRET, "DN-2026-000001", expSec);
    const callback = callbackSignature(TEST_SECRET, "DN-2026-000001", "COMPLETED", "", expSec * 1000);
    expect(grant).not.toBe(callback);
  });

  test("signature is 64 lowercase hex characters", () => {
    expect(checkoutGrantSignature(TEST_SECRET, "DN-2026-000001", expSec)).toMatch(/^[0-9a-f]{64}$/);
  });
});
