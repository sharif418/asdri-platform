import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  callbackSignature,
  callbackTsFresh,
  completeDonation,
  failDonation,
  timingSafeHexEqual,
} from "@/lib/payments";
import { getClientIp, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { paymentCallbackSchema, zodFields } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * POST /api/donations/callback — signed payment-gateway callback (the contract
 * a real gateway adapter will use; the sandbox provider completes through
 * /api/donations/sandbox-complete instead).
 *
 * Body: { trackingCode, status: "COMPLETED" | "FAILED", providerTxnId?, ts, signature }
 * signature = hex(HMAC-SHA256(PAYMENT_CALLBACK_SECRET,
 *            `${trackingCode}|${status}|${providerTxnId ?? ""}|${ts}`))
 * ts = epoch milliseconds; the request is rejected when it strays more than
 * ±15 minutes from server time (a captured callback cannot be replayed later).
 *
 * No same-origin requirement — the signature + timestamp are the auth.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "donations-callback", identifier: ip, limit: 30, windowMs: 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার কলব্যাক পাঠানো হয়েছে", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("অনুরোধের বডি পার্স করা যায়নি", "VALIDATION", 400);
  }

  const parsed = paymentCallbackSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("কলব্যাকের তথ্যগুলো যাচাই করুন", "VALIDATION", 400, zodFields(parsed.error));
  }

  const { trackingCode, status, ts } = parsed.data;
  const providerTxnId = parsed.data.providerTxnId || null;

  // Freshness first: a timestamp outside the ±15-minute window is rejected
  // before any signature work (replay protection).
  if (!callbackTsFresh(ts)) {
    return jsonError("কলব্যাকের সময়টি গ্রহণযোগ্য নয় (মেয়াদ শেষ)", "FORBIDDEN", 403);
  }

  const donation = await db.donation.findUnique({
    where: { trackingCode },
    include: { fund: { select: { nameBn: true, nameEn: true } } },
  });
  if (!donation) {
    return jsonError("এই ট্র্যাকিং কোডে কোনো অনুদান পাওয়া যায়নি", "NOT_FOUND", 404);
  }

  const expected = callbackSignature(trackingCode, status, providerTxnId, ts);
  if (!timingSafeHexEqual(expected, parsed.data.signature)) {
    await db.paymentTransaction.create({
      data: {
        donationId: donation.id,
        provider: donation.provider,
        event: "callback",
        signatureValid: false,
        rawPayload: { trackingCode, status, providerTxnId, ts, reason: "invalid-signature" },
      },
    });
    return jsonError("স্বাক্ষর যাচাই হয়নি", "FORBIDDEN", 403);
  }

  const rawPayload = { trackingCode, status, providerTxnId, ts };

  if (status === "COMPLETED") {
    const result = await completeDonation(donation, providerTxnId, rawPayload);
    if (result.alreadyCompleted) {
      return jsonOk({ status: "COMPLETED", message: "এই অনুদান ইতিমধ্যেই সম্পন্ন হয়েছে।" });
    }
    return jsonOk({ status: "COMPLETED", message: "অনুদান সম্পন্ন হিসেবে নিশ্চিত করা হয়েছে।" });
  }

  // FAILED — only a pending (or failed) donation transitions; a completed
  // donation is never downgraded by a late failure callback.
  const changed = await failDonation(donation, providerTxnId, rawPayload);
  if (!changed) {
    return jsonOk({
      status: donation.status,
      message: "অনুদানটির বর্তমান অবস্থা পরিবর্তন করা হয়নি।",
    });
  }

  return jsonOk({ status: "FAILED", message: "অনুদানটি ব্যর্থ হিসেবে চিহ্নিত করা হয়েছে।" });
}
