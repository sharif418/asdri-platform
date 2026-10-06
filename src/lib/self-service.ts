import { normalizeDigitsInput } from "@/lib/format";

/**
 * Shared helpers for the public self-service lookups
 * (/admissions/status + /support/receipt-lookup).
 *
 * Both lookups pair a tracking code with a second factor (phone / email)
 * because the codes alone are guessable: donation codes are sequential
 * (DN-2026-000001…) and application numbers live in a ~900k space.
 */

/** Lookups are enumeration-sensitive: tighter than the generic buckets. */
export const LOOKUP_LIMITS = {
  limit: 8,
  windowMs: 15 * 60 * 1000,
} as const;

/** Application tracking number: ASDRI-<year>-<6 digits>. */
export const TRACKING_NO_RE = /^ASDRI-\d{4}-\d{6}$/;

/** Donation identifier: tracking code DN-… or receipt number ASDRI-R-…. */
export const DONATION_CODE_RE = /^(DN-\d{4}-\d{6}|ASDRI-R-\d{6})$/;

/** Email — same shape the account/donation forms accept. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Digits-only phone, with 880/0/8800-style Bangladesh prefixes folded away:
 * "+880 1712-345678", "৮৮০১৭১২৩৪৫৬৭৮", "01712345678" → "1712345678".
 * Returns "" when nothing digit-like remains.
 */
export function normalizePhone(raw: string): string {
  const digits = normalizeDigitsInput(raw); // Bengali→Latin, non-digits stripped
  if (digits.startsWith("880")) return digits.slice(3);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/**
 * Compare a stored donor/applicant phone with the one typed into the lookup
 * form. Both sides are normalized, so a donor who typed "+880171…" at
 * donation time can authenticate with "0171…" (or vice versa).
 */
export function phonesMatch(stored: string | null | undefined, given: string): boolean {
  if (!stored || !given) return false;
  return normalizePhone(stored) === normalizePhone(given);
}

/** Case-insensitive email equality on trimmed values. */
export function emailsMatch(stored: string | null | undefined, given: string): boolean {
  if (!stored || !given) return false;
  return stored.trim().toLowerCase() === given.trim().toLowerCase();
}

/**
 * The single error both lookup routes return for every "not found /
 * wrong second factor" outcome — the same status, code and message, so the
 * response cannot be used to distinguish a bad code from a bad phone.
 */
export function lookupMismatch(bn: boolean): string {
  return bn
    ? "তথ্য মেলেনি — ট্র্যাকিং নম্বর ও মোবাইল নম্বর (বা ইমেইল) আবার যাচাই করুন।"
    : "No match — please re-check the tracking number and the phone (or email) you provided.";
}
