import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { issueEmailVerification } from "@/lib/email-verification";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/verify-email/resend — re-send the verification email for the
 * logged-in unverified account. Requires a session (any role), same-origin and
 * is rate limited hard (3 per hour per IP): the endpoint exists for the
 * account owner, not for mail bombing.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("অননুমোদিত উৎস", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "verify-resend", identifier: ip, limit: 3, windowMs: 60 * 60_000 });
  if (!limiter.ok) {
    return jsonError("নতুন লিংকের অনুরোধ অনেকবার পাঠানো হয়েছে — এক ঘণ্টা পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  const session = await getSession();
  if (!session) {
    return jsonError("আবার লিংক নিতে অ্যাকাউন্টে লগইন করুন।", "UNAUTHORIZED", 401);
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return jsonError("অ্যাকাউন্টটি খুঁজে পাওয়া যায়নি।", "NOT_FOUND", 404);
  }
  if (user.emailVerifiedAt) {
    return jsonOk({ alreadyVerified: true, message: "আপনার ইমেইল ইতিমধ্যেই নিশ্চিত হয়েছে।" });
  }

  await issueEmailVerification({ id: user.id, email: user.email, name: user.name });
  return jsonOk({ sent: true, message: "নতুন ভেরিফিকেশন লিংক ইমেইল করা হয়েছে (মেয়াদ ৪৮ ঘণ্টা)।" });
}
