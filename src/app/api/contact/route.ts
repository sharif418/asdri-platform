import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { contactSchema, zodFields } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** POST /api/contact — store a contact-form message (rate-limited per IP). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("অননুমোদিত উৎস", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "contact", identifier: ip, limit: 3, windowMs: 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার বার্তা পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("অনুরোধের বডি পার্স করা যায়নি", "VALIDATION", 400);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("ফর্মের তথ্যগুলো যাচাই করুন", "VALIDATION", 400, zodFields(parsed.error));
  }

  try {
    await db.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    });

    return jsonOk(
      { message: "আপনার বার্তা গৃহীত হয়েছে — দ্রুততম সময়ের মধ্যে ইনশাআল্লাহ আমরা যোগাযোগ করব।" },
      201,
    );
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "SERVER", 500);
  }
}
