import { NextRequest, NextResponse } from "next/server";
import { Prisma, type Donation } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getSitePayment } from "@/lib/settings";
import { siteConfig } from "@/content/site";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { donationSchema, zodFields } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** Manual payment channels (DB setting first, static content as fallback). */
async function paymentChannels(): Promise<{ bkash: string; nagad: string; rocket: string; bank: string }> {
  const payment = await getSitePayment();
  return {
    bkash: payment.bkash || siteConfig.payment.bkash,
    nagad: payment.nagad || siteConfig.payment.nagad,
    rocket: payment.rocket || siteConfig.payment.rocket,
    bank: payment.bankBn || siteConfig.payment.bankBn,
  };
}

/** Create the donation row with generated codes, retrying on collisions. */
async function createDonation(
  data: Omit<Prisma.DonationCreateInput, "trackingCode" | "receiptNo">,
): Promise<Donation> {
  const year = new Date().getFullYear();
  let lastError: unknown = new Error("রিসিপ্ট নম্বর তৈরি করা যায়নি");
  for (let attempt = 0; attempt < 5; attempt++) {
    const seq = (await db.donation.count()) + 1 + attempt;
    const padded = String(seq).padStart(6, "0");
    try {
      return await db.donation.create({
        data: {
          ...data,
          trackingCode: `DN-${year}-${padded}`,
          receiptNo: `ASDRI-R-${padded}`,
        },
      });
    } catch (error) {
      lastError = error;
      const collision = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!collision) throw error;
    }
  }
  throw lastError;
}

/**
 * POST /api/donations — record a donation intent and return payment
 * instructions (manual channels in the sandbox; a real gateway replaces
 * the paymentInfo step only).
 *
 * The row is created PENDING with its tracking + receipt codes and an
 * `initiated` PaymentTransaction; the signed sandbox callback completes it.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("অননুমোদিত উৎস", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "donations-create", identifier: ip, limit: 5, windowMs: 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার অনুরোধ পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("অনুরোধের বডি পার্স করা যায়নি", "VALIDATION", 400);
  }

  const parsed = donationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("ফর্মের তথ্যগুলো যাচাই করুন", "VALIDATION", 400, zodFields(parsed.error));
  }

  const input = parsed.data;
  try {
    const fund = await db.fund.findUnique({ where: { key: input.fundType } });
    if (!fund || !fund.isEnabled) {
      return jsonError("এই ফান্ডটি বর্তমানে অনুদান গ্রহণ করছে না", "VALIDATION", 400, {
        fundType: "ফান্ডটি নিষ্ক্রিয় বা খুঁজে পাওয়া যায়নি",
      });
    }

    const provider = env.paymentProvider;
    const donation = await createDonation({
      fund: { connect: { id: fund.id } },
      amount: input.amount,
      currency: input.currency,
      donorName: input.donorName,
      isAnonymous: input.anonymous,
      donorEmail: input.email,
      donorPhone: input.phone || null,
      sponsorStudentRef: input.studentRef || null,
      message: input.message || null,
      status: "PENDING",
      provider,
      transactions: {
        create: {
          provider,
          event: "initiated",
          // The Donation model has no `recurring` column yet — the intent is
          // captured on the payment trail instead (see worklog note).
          rawPayload: {
            fundType: input.fundType,
            amount: input.amount,
            currency: input.currency,
            anonymous: input.anonymous,
            recurring: input.recurring,
          } as Prisma.InputJsonValue,
        },
      },
    });

    return jsonOk(
      {
        receiptNo: donation.receiptNo ?? donation.trackingCode,
        trackingCode: donation.trackingCode,
        message: input.anonymous
          ? "আলহামদুলিল্লাহ! আপনার অনুদান রেকর্ড হয়েছে — আপনার নাম প্রকাশ্য তালিকায় “Anonymous” হিসেবে দেখানো হবে।"
          : "আলহামদুলিল্লাহ! আপনার অনুদান রেকর্ড হয়েছে — নিচের যেকোনো মাধ্যমে পেমেন্ট সম্পন্ন করুন।",
        paymentInfo: await paymentChannels(),
      },
      201,
    );
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "SERVER", 500);
  }
}
