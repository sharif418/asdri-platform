import { randomBytes } from "node:crypto";

/**
 * One-time plaintext password generation for staff accounts — created on the
 * server, shown to the admin exactly once, never stored in plaintext.
 */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** Readable random password: Asr-XXXXXXXXXXXXXX (no ambiguous glyphs). */
export function generatePassword(): string {
  const bytes = randomBytes(14);
  let password = "";
  for (let i = 0; i < 14; i++) {
    password += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `Asr-${password}`;
}
