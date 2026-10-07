import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { isStaff, ROLE_LABELS_BN } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

/**
 * Invitations — how every office-controlled account begins.
 *
 * An officer creates an Invitation (single-use, 7-day expiry); the invitee
 * opens /accept-invite?token=… and sets a password. The token is random
 * 32 bytes URL-safe; only its SHA-256 rests in the DB. On acceptance the
 * user is created with the invited role, the email counts as verified (the
 * office vouched for it), a TeacherAssignment is created for scoped teacher
 * invitations, and a session starts immediately.
 *
 * Public self-registration stays for applicants and donors; everything the
 * office controls comes through here.
 */

const INVITE_TTL_DAYS = 7;

export interface CreateInvitationInput {
  email: string;
  name: string;
  role: UserRole;
  courseId?: string | null;
  note?: string;
  createdById: string;
}

export interface CreatedInvitation {
  id: string;
  token: string; // the only time the raw token exists — returned to the officer, never stored
  expiresAt: Date;
  linkPath: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createInvitation(input: CreateInvitationInput): Promise<CreatedInvitation> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  const invitation = await db.invitation.create({
    data: {
      email: input.email.toLowerCase().trim(),
      name: input.name.trim(),
      role: input.role,
      courseId: input.role === "TEACHER" ? (input.courseId ?? null) : null,
      note: input.note?.trim() ?? "",
      tokenHash: hashToken(token),
      expiresAt,
      createdById: input.createdById,
    },
  });
  return { id: invitation.id, token, expiresAt, linkPath: `/accept-invite?token=${token}` };
}

export type AcceptFailure =
  | "not-found" // wrong/expired/used/revoked token — one indistinguishable answer
  | "email-taken"; // an account already exists for this email

export interface AcceptResult {
  ok: true;
  userId: string;
  role: UserRole;
  name: string;
  cookieValue: string;
  csrfToken: string;
  maxAge: number;
}

export async function acceptInvitation(
  token: string,
  password: string,
  meta: { ip?: string; userAgent?: string } = {},
): Promise<AcceptResult | { ok: false; error: AcceptFailure }> {
  const invitation = await db.invitation.findUnique({ where: { tokenHash: hashToken(token) } });
  // Every failure answers identically — an invite link must not leak whether
  // an email was invited, or invite enumeration.
  if (!invitation) return { ok: false, error: "not-found" };
  if (invitation.acceptedAt || invitation.revokedAt) return { ok: false, error: "not-found" };
  if (invitation.expiresAt < new Date()) return { ok: false, error: "not-found" };

  const existing = await db.user.findUnique({ where: { email: invitation.email } });
  if (existing) return { ok: false, error: "email-taken" };

  const user = await db.user.create({
    data: {
      email: invitation.email,
      name: invitation.name,
      passwordHash: hashPassword(password),
      role: invitation.role,
      // the office invited this address — it is vouched for
      emailVerifiedAt: new Date(),
    },
  });

  if (invitation.role === "TEACHER" && invitation.courseId) {
    await db.teacherAssignment.create({
      data: { teacherUserId: user.id, courseId: invitation.courseId },
    });
  }

  await db.invitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date(), acceptedUserId: user.id },
  });

  const session = await createSession(user.id, meta);
  return {
    ok: true,
    userId: user.id,
    role: user.role,
    name: user.name,
    cookieValue: session.cookieValue,
    csrfToken: session.csrfToken,
    maxAge: session.maxAge,
  };
}

/** Constant-time token comparison for lookups that receive a raw token. */
export function tokensMatch(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return ha.length === hb.length && timingSafeEqual(ha, hb);
}

/** Where this account lands after login: staff → admin, everyone else → portal. */
export function homeForRole(role: UserRole): string {
  if (isStaff(role)) return "/admin";
  if (role === "APPLICANT") return "/account";
  return "/portal";
}

/** The Bangla invite e-mail body (log driver queues it to the outbox). */
export function invitationEmailHtml(input: { linkUrl: string; role: UserRole; inviterName: string }): {
  subject: string;
  html: string;
  body: string;
} {
  const roleBn = ROLE_LABELS_BN[input.role];
  const subject = "আস-সুন্নাহ ইনস্টিটিউট — অ্যাকাউন্ট অ্যাক্টিভেশন";
  const body = `আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট আপনাকে "${roleBn}" হিসেবে অন্তর্ভুক্ত করেছে। নিচের লিংকে গিয়ে পাসওয়ার্ড দিয়ে অ্যাকাউন্ট চালু করুন। লিংকটি একবারই ব্যবহার করা যাবে ও ৭ দিন পরে শেষ হয়ে যাবে।\n\n${input.linkUrl}\n\nআমন্ত্রণ পাঠিয়েছেন: ${input.inviterName}`;
  const html =
    `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;border:1px solid #e6e9e3;border-radius:12px;overflow:hidden">` +
    `<div style="background:#0f5132;padding:20px 28px;text-align:center"><p style="margin:0;color:#d4af37;font-size:11px;letter-spacing:2px;text-transform:uppercase">AS-SUNNAH DAWAH &amp; RESEARCH INSTITUTE</p></div>` +
    `<div style="padding:28px">` +
    `<p style="margin:0;font-size:15px;color:#1c2a20">আসসালামু আলাইকুম।</p>` +
    `<p style="margin:14px 0 0;font-size:14px;line-height:1.8;color:#3c4a40">আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট আপনাকে <strong>"${roleBn}"</strong> হিসেবে অন্তর্ভুক্ত করেছে। নিচের বোতামে ক্লিক করে পাসওয়ার্ড দিয়ে অ্যাকাউন্ট চালু করুন। লিংকটি <strong>একবারই</strong> ব্যবহার করা যাবে এবং ৭ দিন পরে শেষ হয়ে যাবে।</p>` +
    `<a href="${input.linkUrl}" style="display:inline-block;background:#0f5132;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;margin:20px 0">অ্যাকাউন্ট চালু করুন</a>` +
    `<p style="margin:6px 0 0;font-size:12px;color:#8a938a">আমন্ত্রণ পাঠিয়েছেন: ${input.inviterName}</p>` +
    `</div>` +
    `<div style="background:#f6f7f4;padding:14px 28px;color:#8a938a;font-size:11px">Satarkul Badda, Dhaka-1212, Bangladesh</div></div>`;
  return { subject, html, body };
}
