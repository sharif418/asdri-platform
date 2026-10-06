import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSitePayment } from "@/lib/settings";
import { siteConfig } from "@/content/site";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import {
  DONATION_CODE_RE,
  EMAIL_RE,
  LOOKUP_LIMITS,
  emailsMatch,
  lookupMismatch,
  phonesMatch,
} from "@/lib/self-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/donations/status-lookup — public donation status + receipt check.
 *
 * The donor proves ownership with the tracking code (DN-2026-XXXXXX) or the
 * receipt number (ASDRI-R-XXXXXX) PAIRED with the phone or the email they
 * filled into the donation form. Codes alone must never be enough — they are
 * sequential (DN-2026-000001…), so an unpaired lookup would expose every
 * donor's amount and name to anyone who can count.
 *
 * Returns the donor's own record only: status, amount, fund/campaign, the
 * receipt number once completed, and — while still PENDING — the manual
 * payment channels with the reference-number instruction, so a donor who
 * lost the confirmation dialog/email can still finish paying.
 */

const bodySchema = z
  .object({
    code: z.string().trim().regex(DONATION_CODE_RE, "সঠিক ট্র্যাকিং/রিসিপ্ট নম্বর দিন (যেমন: DN-2026-000123)"),
    phone: z.string().trim().optional().or(z.literal("")),
    email: z.string().trim().regex(EMAIL_RE, "সঠিক ইমেইল দিন").optional().or(z.literal("")),
    lang: z.enum(["bn", "en"]).default("bn"),
  })
  .refine((data) => Boolean(data.phone) || Boolean(data.email), {
    message: "মোবাইল নম্বর অথবা ইমেইল — যেকোনো একটি দিন",
    path: ["phone"],
  });

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonError("অননুমোদিত উৎস।", "FORBIDDEN", 403);
  }

  const limited = rateLimit({
    key: "donations-status-lookup",
    identifier: getClientIp(request),
    ...LOOKUP_LIMITS,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "অনেকবার চেষ্টা হয়েছে — কিছুক্ষণ পর আবার করুন।" },
      { status: 429, headers: { "retry-after": String(limited.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("অনুরোধ পড়া যায়নি।", "VALIDATION", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return jsonError("সঠিক তথ্য দিন।", "VALIDATION", 400, {
      [String(issue.path[0] ?? "form")]: issue.message,
    });
  }

  const { code, phone, email, lang } = parsed.data;
  const mismatch = () =>
    NextResponse.json({ ok: false, error: lookupMismatch(lang === "bn") }, { status: 404 });

  const donation = await db.donation.findFirst({
    where: { OR: [{ trackingCode: code }, { receiptNo: code }] },
    select: {
      trackingCode: true,
      receiptNo: true,
      status: true,
      amount: true,
      currency: true,
      donorName: true,
      isAnonymous: true,
      donorPhone: true,
      donorEmail: true,
      message: true,
      paidAt: true,
      createdAt: true,
      fund: { select: { nameBn: true, nameEn: true } },
      campaign: { select: { titleBn: true, titleEn: true } },
    },
  });

  if (!donation) return mismatch();

  // Second factor: the phone OR the email used on the form must match. A
  // donation stored with neither cannot be verified by the public route —
  // the office can still look it up in the admin ledger.
  const verified =
    (donation.donorPhone && phone && phonesMatch(donation.donorPhone, phone)) ||
    (donation.donorEmail && email && emailsMatch(donation.donorEmail, email));
  if (!verified) return mismatch();

  // PENDING donations still need the manual-channel instructions; reuse the
  // DB setting with the static fallback, exactly like the POST /api/donations
  // response does.
  let paymentInfo: { bkash: string; nagad: string; rocket: string; bank: string } | null = null;
  if (donation.status === "PENDING") {
    const payment = await getSitePayment();
    paymentInfo = {
      bkash: payment.bkash || siteConfig.payment.bkash,
      nagad: payment.nagad || siteConfig.payment.nagad,
      rocket: payment.rocket || siteConfig.payment.rocket,
      bank: payment.bankBn || siteConfig.payment.bankBn,
    };
  }

  return jsonOk({
    trackingCode: donation.trackingCode,
    receiptNo: donation.status === "COMPLETED" ? donation.receiptNo : null,
    status: donation.status,
    amount: donation.amount,
    currency: donation.currency,
    donorName: donation.donorName,
    isAnonymous: donation.isAnonymous,
    message: donation.message || null,
    fundName: { bn: donation.fund.nameBn, en: donation.fund.nameEn },
    campaignTitle: donation.campaign ? { bn: donation.campaign.titleBn, en: donation.campaign.titleEn } : null,
    paidAt: donation.paidAt,
    createdAt: donation.createdAt,
    paymentInfo,
  });
}
