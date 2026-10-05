import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { buildDonationReceiptEmail, queueOutboxEmail } from "@/lib/mail";
import { getClientIp, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { paymentCallbackSchema, zodFields } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * POST /api/donations/callback — signed sandbox payment-gateway callback.
 *
 * Body: { trackingCode, status: "COMPLETED" | "FAILED", providerTxnId?, signature }
 * signature = hex(HMAC-SHA256(PAYMENT_CALLBACK_SECRET,
 *            `${trackingCode}|${status}|${providerTxnId ?? ""}`)).
 *
 * This exercises exactly the verification path a real gateway will use:
 * timing-safe signature check, idempotent state transitions, a
 * PaymentTransaction event per callback, and the emailed receipt (outbox)
 * on completion. No same-origin requirement — the signature is the auth.
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

  const { trackingCode, status } = parsed.data;
  const providerTxnId = parsed.data.providerTxnId || null;

  const donation = await db.donation.findUnique({
    where: { trackingCode },
    include: { fund: { select: { nameBn: true, nameEn: true } } },
  });
  if (!donation) {
    return jsonError("এই ট্র্যাকিং কোডে কোনো অনুদান পাওয়া যায়নি", "NOT_FOUND", 404);
  }

  const canonical = `${trackingCode}|${status}|${providerTxnId ?? ""}`;
  const expected = createHmac("sha256", env.paymentCallbackSecret).update(canonical).digest("hex");
  const given = parsed.data.signature.toLowerCase();
  const signatureValid =
    expected.length === given.length &&
    timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(given, "utf8"));

  if (!signatureValid) {
    await db.paymentTransaction.create({
      data: {
        donationId: donation.id,
        provider: donation.provider,
        event: "callback",
        signatureValid: false,
        rawPayload: { trackingCode, status, providerTxnId, reason: "invalid-signature" },
      },
    });
    return jsonError("স্বাক্ষর যাচাই হয়নি", "FORBIDDEN", 403);
  }

  const rawPayload = { trackingCode, status, providerTxnId };

  if (status === "COMPLETED") {
    // Claim the transition atomically so concurrent callbacks cannot
    // double-complete or double-send the receipt.
    const claimed = await db.donation.updateMany({
      where: { id: donation.id, status: { not: "COMPLETED" } },
      data: { status: "COMPLETED", paidAt: new Date(), providerTxnId },
    });
    if (claimed.count === 0) {
      return jsonOk({ status: "COMPLETED", message: "এই অনুদান ইতিমধ্যেই সম্পন্ন হয়েছে।" });
    }

    await db.paymentTransaction.create({
      data: {
        donationId: donation.id,
        provider: donation.provider,
        event: "verified",
        signatureValid: true,
        rawPayload,
      },
    });

    if (donation.donorEmail) {
      await queueOutboxEmail(
        buildDonationReceiptEmail({
          to: donation.donorEmail,
          receiptNo: donation.receiptNo ?? donation.trackingCode,
          trackingCode: donation.trackingCode,
          fundName: donation.fund.nameEn || donation.fund.nameBn,
          amount: donation.amount,
          currency: donation.currency,
          donorName: donation.donorName,
          paidAt: new Date(),
        }),
      );
      await db.donation.update({ where: { id: donation.id }, data: { receiptSentAt: new Date() } });
    }

    return jsonOk({ status: "COMPLETED", message: "অনুদান সম্পন্ন হিসেবে নিশ্চিত করা হয়েছে।" });
  }

  // FAILED — only a pending (or failed) donation transitions; a completed
  // donation is never downgraded by a late failure callback.
  const claimed = await db.donation.updateMany({
    where: { id: donation.id, status: "PENDING" },
    data: { status: "FAILED", providerTxnId },
  });
  if (claimed.count === 0) {
    return jsonOk({
      status: donation.status,
      message: "অনুদানটির বর্তমান অবস্থা পরিবর্তন করা হয়নি।",
    });
  }

  await db.paymentTransaction.create({
    data: {
      donationId: donation.id,
      provider: donation.provider,
      event: "failed",
      signatureValid: true,
      rawPayload,
    },
  });

  return jsonOk({ status: "FAILED", message: "অনুদানটি ব্যর্থ হিসেবে চিহ্নিত করা হয়েছে।" });
}
