import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { newsletterSchema, zodFields } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** POST /api/newsletter — subscribe an email (duplicates handled gracefully). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid origin", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "newsletter", identifier: ip, limit: 8, windowMs: 10 * 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার চেষ্টা করেছেন, কিছুক্ষণ পর আবার করুন", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", "VALIDATION", 400);
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "সঠিক ইমেইল দিন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return jsonOk({ message: "আপনি ইতিমধ্যাই সাবস্ক্রাইব করেছেন — জাযাকাল্লাহু খাইরান!" });
    }

    await db.newsletterSubscriber.create({ data: { email: parsed.data.email } });
    return jsonOk(
      { message: "সাবস্ক্রিপশন সফল হয়েছে — ইনশাআল্লাহ আপডেট সবার আগে পাবেন।" },
      201,
    );
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "SERVER", 500);
  }
}
