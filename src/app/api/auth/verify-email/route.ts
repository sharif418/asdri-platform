import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeEmailVerification } from "@/lib/email-verification";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  token: z.string().trim().min(32).max(128),
});

/**
 * POST /api/auth/verify-email — consume the one-time token from the emailed
 * link and set User.emailVerifiedAt. Same-origin + rate limited; the token
 * itself is the secret (single use, 48h expiry).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("অননুমোদিত উৎস", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "verify-email", identifier: ip, limit: 10, windowMs: 10 * 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার চেষ্টা করেছেন, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("অনুরোধের বডি পার্স করা যায়নি", "VALIDATION", 400);
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("ভেরিফিকেশন লিংকটি সঠিক নয়", "VALIDATION", 400);
  }

  const outcome = await consumeEmailVerification(parsed.data.token);
  if (!outcome.ok) {
    const message =
      outcome.reason === "expired"
        ? "লিংকটির মেয়াদ (৪৮ ঘণ্টা) শেষ — লগইন করে নতুন লিংক নিন।"
        : outcome.reason === "used"
          ? "লিংকটি ইতিমধ্যে ব্যবহার হয়েছে।"
          : "লিংকটি সঠিক নয়।";
    return jsonError(message, "FORBIDDEN", 403);
  }

  return jsonOk({ verified: true, email: outcome.email, message: "ইমেইল নিশ্চিত হয়েছে — জাযাকাল্লাহু খাইরান।" });
}
