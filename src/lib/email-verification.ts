import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { buildVerificationEmail, queueOutboxEmail } from "@/lib/mail";

/**
 * Email verification service (round 3). Registration no longer trusts an
 * address: a single-use token is emailed, and only consuming it sets
 * User.emailVerifiedAt — which is what unlocks the donation history linked to
 * the address on /account.
 *
 * The raw token exists only in the emailed link; the row stores sha256(token).
 */

const VERIFICATION_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Mint a fresh verification token for a user, invalidating older unused ones. */
export async function issueEmailVerification(user: { id: string; email: string; name: string }): Promise<void> {
  // Previous unused tokens for this user are dead the moment a new one exists.
  await db.emailVerification.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const raw = randomBytes(32).toString("hex");
  await db.emailVerification.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  const link = `${env.siteUrl}/verify-email?token=${raw}`;
  await queueOutboxEmail(buildVerificationEmail({ to: user.email, name: user.name, link }));
}

export type VerifyOutcome =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/** Consume a verification token: mark the user's email verified. */
export async function consumeEmailVerification(rawToken: string): Promise<VerifyOutcome> {
  const row = await db.emailVerification.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!row) return { ok: false, reason: "invalid" };
  if (row.usedAt) return { ok: false, reason: "used" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "expired" };

  await db.$transaction([
    db.emailVerification.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    db.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
  ]);

  const user = await db.user.findUnique({ where: { id: row.userId }, select: { email: true } });
  return { ok: true, email: user?.email ?? "" };
}
