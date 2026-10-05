import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { isFeatureEnabled } from "@/lib/settings";
import { newsletterSchema, zodFields } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** POST /api/newsletter — subscribe an email (idempotent, resubscribes).
 *
 * A row that exists with `confirmed: false` counts as unsubscribed — the
 * same request flips it back to confirmed. Already-confirmed subscribers
 * get the same success envelope so the form never exposes list membership.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isFeatureEnabled("newsletter"))) {
    return jsonError("নিউজলেটার বর্তমানে বন্ধ আছে।", "FORBIDDEN", 403);
  }
  if (!isSameOrigin(request)) {
    return jsonError("অননুমোদিত উৎস", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "newsletter", identifier: ip, limit: 3, windowMs: 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার চেষ্টা করেছেন, কিছুক্ষণ পর আবার করুন", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("অনুরোধের বডি পার্স করা যায়নি", "VALIDATION", 400);
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("সঠিক ইমেইল দিন", "VALIDATION", 400, zodFields(parsed.error));
  }

  try {
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing?.confirmed) {
      return jsonOk({ message: "আপনি ইতিমধ্যাই সাবস্ক্রাইব করেছেন — জাযাকাল্লাহু খাইরান!" });
    }

    if (existing) {
      await db.newsletterSubscriber.update({
        where: { email: parsed.data.email },
        data: { confirmed: true },
      });
      return jsonOk({ message: "স্বাগতম! আপনি আবার সাবস্ক্রাইব করেছেন — ইনশাআল্লাহ আপডেট সবার আগে পাবেন।" });
    }

    await db.newsletterSubscriber.create({
      data: { email: parsed.data.email, locale: "bn", confirmed: true },
    });
    return jsonOk(
      { message: "সাবস্ক্রিপশন সফল হয়েছে — ইনশাআল্লাহ আপডেট সবার আগে পাবেন।" },
      201,
    );
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "SERVER", 500);
  }
}
