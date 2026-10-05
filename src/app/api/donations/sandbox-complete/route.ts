import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { completeDonation, isSandboxProvider } from "@/lib/payments";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const sandboxCompleteSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^DN-\d{4}-\d{6}$/, "সঠিক ট্র্যাকিং কোড দিন"),
});

/**
 * POST /api/donations/sandbox-complete — the sandbox checkout's confirm button.
 *
 * Round 3 fix: the completion signature is computed server-side HERE and used
 * internally; the browser only submits the tracking code it was already
 * granted (the expiring signed checkout link). No signature, secret or HMAC
 * ever reaches the client, so a visitor cannot mint a "COMPLETED" callback.
 *
 * Guardrails: same-origin + rate limit + provider must be sandbox (the route
 * 404s otherwise — production boots with a non-sandbox provider or refuses to
 * start) + the donation must still be PENDING.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("অননুমোদিত উৎস", "UNAUTHORIZED", 403);
  }
  if (!isSandboxProvider()) {
    // Not the sandbox provider: this route does not exist.
    return new NextResponse(null, { status: 404 });
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "sandbox-complete", identifier: ip, limit: 10, windowMs: 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার অনুরোধ পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("অনুরোধের বডি পার্স করা যায়নি", "VALIDATION", 400);
  }

  const parsed = sandboxCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("ট্র্যাকিং কোডটি সঠিক নয়", "VALIDATION", 400);
  }

  const donation = await db.donation.findUnique({
    where: { trackingCode: parsed.data.code },
    include: { fund: { select: { nameBn: true, nameEn: true } } },
  });
  if (!donation) {
    return jsonError("এই ট্র্যাকিং কোডে কোনো অনুদান পাওয়া যায়নি", "NOT_FOUND", 404);
  }
  if (donation.status !== "PENDING") {
    return jsonOk({ status: donation.status, message: "এই পেমেন্টের আর কিছু করার নেই।" });
  }

  const providerTxnId = `SBX-${donation.trackingCode}-${Date.now()}`;
  await completeDonation(donation, providerTxnId, {
    trackingCode: donation.trackingCode,
    status: "COMPLETED",
    providerTxnId,
    via: "sandbox-confirm",
  });

  return jsonOk({
    status: "COMPLETED",
    receiptNo: donation.receiptNo ?? donation.trackingCode,
    message: "অনুদান সম্পন্ন হিসেবে নিশ্চিত করা হয়েছে।",
  });
}
