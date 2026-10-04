import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { Prisma, type DonationIntent } from "@prisma/client";
import { db } from "@/lib/db";
import { siteConfig } from "@/content/site";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { donationSchema, zodFields } from "@/lib/validators";

export const dynamic = "force-dynamic";

const RECEIPT_RE = /^ASR-DON-\d{8}-[0-9A-F]{4}$/;

/** `ASR-DON-{YYYYMMDD}-{4 random hex chars}` */
function generateReceiptNo(): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `ASR-DON-${ymd}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

/** Create a donation intent, retrying with a fresh receipt number on collisions. */
async function createIntent(data: Omit<Prisma.DonationIntentCreateInput, "receiptNo">): Promise<DonationIntent> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.donationIntent.create({ data: { ...data, receiptNo: generateReceiptNo() } });
    } catch (error) {
      const isCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < 4;
      if (!isCollision) throw error;
    }
  }
  // Unreachable in practice — the loop always returns or throws.
  throw new Error("Failed to generate a unique receipt number");
}

/** POST /api/donations — record a donation intent and return payment instructions. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid origin", "UNAUTHORIZED", 403);
  }

  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "donations-create", identifier: ip, limit: 10, windowMs: 10 * 60_000 });
  if (!limiter.ok) {
    return jsonError("অনেকবার অনুরোধ পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", "VALIDATION", 400);
  }

  const parsed = donationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const intent = await createIntent({
      fundType: parsed.data.fundType,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      donorName: parsed.data.donorName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      anonymous: parsed.data.anonymous,
      studentRef: parsed.data.studentRef || null,
      recurring: parsed.data.recurring,
      message: parsed.data.message || null,
      status: "initiated",
    });

    return jsonOk(
      {
        receiptNo: intent.receiptNo,
        message: parsed.data.anonymous
          ? "আলহামদুলিল্লাহ! আপনার অনুদান রেকর্ড হয়েছে — আপনার নাম প্রকাশ্য তালিকায় “Anonymous” হিসেবে দেখানো হবে।"
          : "আলহামদুলিল্লাহ! আপনার অনুদান রেকর্ড হয়েছে — নিচের যেকোনো মাধ্যমে পেমেন্ট সম্পন্ন করুন।",
        paymentInfo: {
          bkash: siteConfig.payment.bkash,
          nagad: siteConfig.payment.nagad,
          rocket: siteConfig.payment.rocket,
          bank: siteConfig.payment.bankBn,
        },
      },
      201,
    );
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "SERVER", 500);
  }
}

/** GET /api/donations?receipt=ASR-DON-... — look up a donation (anonymous-safe). */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const limiter = rateLimit({ key: "donations-read", identifier: ip, limit: 30, windowMs: 60_000 });
  if (!limiter.ok) {
    return jsonError("Too many requests", "RATE_LIMIT", 429);
  }

  const receipt = request.nextUrl.searchParams.get("receipt")?.trim().toUpperCase() ?? "";
  if (!RECEIPT_RE.test(receipt)) {
    return jsonError("সঠিক রিসিপ্ট নম্বর দিন (যেমন: ASR-DON-20250101-AB12)", "VALIDATION", 400);
  }

  try {
    const intent = await db.donationIntent.findUnique({ where: { receiptNo: receipt } });
    if (!intent) {
      return jsonError("এই নম্বরে কোনো রিসিপ্ট পাওয়া যায়নি", "NOT_FOUND", 404);
    }

    return jsonOk({
      receiptNo: intent.receiptNo,
      fundType: intent.fundType,
      amount: intent.amount,
      currency: intent.currency,
      donorName: intent.anonymous ? "Anonymous" : intent.donorName,
      anonymous: intent.anonymous,
      recurring: intent.recurring,
      status: intent.status,
      createdAt: intent.createdAt.toISOString(),
    });
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
