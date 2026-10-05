import { describe, test, expect } from "bun:test";
import { createHmac } from "node:crypto";

/**
 * NOTE (duplication): the callback + checkout signature functions live inline
 * in the route handlers (src/app/api/donations/route.ts + callback/route.ts),
 * which are not exported as pure functions. The re-implementations below
 * mirror the documented contract; tests/integration/donations.test.ts proves
 * the routes agree with them by invoking the real handlers, so a drift in
 * either place fails a test.
 */

const TEST_SECRET =
  "0f4a8b2c6d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a";

/** Contract: hex HMAC-SHA256(secret, `${trackingCode}|${status}|${providerTxnId ?? ""}`). */
export function callbackSignature(
  secret: string,
  trackingCode: string,
  status: "COMPLETED" | "FAILED",
  providerTxnId: string | null,
): string {
  const canonical = `${trackingCode}|${status}|${providerTxnId ?? ""}`;
  return createHmac("sha256", secret).update(canonical).digest("hex");
}

/** Contract: hex HMAC-SHA256(secret, trackingCode) — the /checkout page grant. */
export function checkoutGrantSignature(secret: string, trackingCode: string): string {
  return createHmac("sha256", secret).update(trackingCode).digest("hex");
}

describe("donation callback HMAC contract", () => {
  test("matches the pinned known vector (algorithm + canonical string)", () => {
    // Vector precomputed with node:crypto over the documented canonical string.
    expect(callbackSignature(TEST_SECRET, "DN-2026-000001", "COMPLETED", "TXN-ABC-123")).toBe(
      "bca758a3dd21f8d95b8f412d04dd4ffbdef422166771e2591e875bc46396dc4b",
    );
  });

  test("null and empty providerTxnId produce the same (trailing pipe) canonical form", () => {
    expect(callbackSignature(TEST_SECRET, "DN-2026-000001", "FAILED", null)).toBe(
      "b14c102410446aa4cac9408e84583fdf883abee73b9ab334e46bfd90d468c638",
    );
    expect(callbackSignature(TEST_SECRET, "DN-2026-000001", "FAILED", null)).toBe(
      callbackSignature(TEST_SECRET, "DN-2026-000001", "FAILED", ""),
    );
  });

  test("status and tracking code are both signed — flipping either flips the digest", () => {
    const base = callbackSignature(TEST_SECRET, "DN-2026-000001", "COMPLETED", null);
    expect(callbackSignature(TEST_SECRET, "DN-2026-000001", "FAILED", null)).not.toBe(base);
    expect(callbackSignature(TEST_SECRET, "DN-2026-000002", "COMPLETED", null)).not.toBe(base);
    expect(callbackSignature("another-secret", "DN-2026-000001", "COMPLETED", null)).not.toBe(base);
  });

  test("signature is 64 lowercase hex characters (matches paymentCallbackSchema)", () => {
    const sig = callbackSignature(TEST_SECRET, "DN-2026-000001", "COMPLETED", "T1");
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("checkout page grant HMAC contract", () => {
  test("signs the tracking code alone, matching the pinned vector", () => {
    expect(checkoutGrantSignature(TEST_SECRET, "DN-2026-000001")).toBe(
      "ae7518b1fc7125dcd5b4a3a766544d2d18b43717c3ec46eae57bff0cc3ad252d",
    );
  });

  test("the page grant differs from the callback signature for the same code (narrower input)", () => {
    const grant = checkoutGrantSignature(TEST_SECRET, "DN-2026-000001");
    const callback = callbackSignature(TEST_SECRET, "DN-2026-000001", "COMPLETED", "");
    expect(grant).not.toBe(callback);
  });
});
