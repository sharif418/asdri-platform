import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { zodFields } from "@/lib/validators";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { LOOKUP_LIMITS, TRACKING_NO_RE, lookupMismatch, normalizePhone, phonesMatch } from "@/lib/self-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admissions/status-lookup — public application status check.
 *
 * Anyone who knows BOTH the tracking number (ASDRI-2026-XXXXXX, shown to the
 * applicant at submit time) and the mobile number on the application may see
 * that application's status track. No PII beyond what the applicant
 * themselves entered is returned — no address, NID, exam scores, or officer
 * notes; the event list carries status + timestamp only.
 *
 * Anti-enumeration: unknown number, wrong phone and unsubmitted drafts all
 * return the same 404 with the same message; the route is same-origin
 * checked and rate-limited tighter than the public buckets.
 */

const bodySchema = z.object({
  trackingNo: z
    .string()
    .trim()
    .regex(TRACKING_NO_RE, "সঠিক ট্র্যাকিং নম্বর দিন (যেমন: ASDRI-2026-123456)"),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((digits) => digits.length >= 10 && digits.length <= 14, "সঠিক মোবাইল নম্বর দিন"),
  lang: z.enum(["bn", "en"]).default("bn"),
});

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonError("অননুমোদিত উৎস।", "FORBIDDEN", 403);
  }

  const limited = rateLimit({
    key: "admissions-status-lookup",
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
    return jsonError("সঠিক তথ্য দিন।", "VALIDATION", 400, zodFields(parsed.error));
  }

  const { trackingNo, phone, lang } = parsed.data;
  const mismatch = () =>
    NextResponse.json({ ok: false, error: lookupMismatch(lang === "bn") }, { status: 404 });

  const application = await db.application.findUnique({
    where: { trackingNo },
    select: {
      status: true,
      submittedAt: true,
      updatedAt: true,
      phone: true,
      fullNameBn: true,
      fullNameEn: true,
      intake: { select: { year: true, course: { select: { code: true, titleBn: true, titleEn: true } } } },
      events: {
        where: { status: { not: "DRAFT" } },
        orderBy: { createdAt: "asc" },
        select: { status: true, createdAt: true },
      },
    },
  });

  // Unknown number, wrong second factor, or a draft that was never submitted
  // — one identical answer for all three.
  if (!application || application.status === "DRAFT" || !phonesMatch(application.phone, phone)) {
    return mismatch();
  }

  return jsonOk({
    trackingNo,
    status: application.status,
    submittedAt: application.submittedAt,
    updatedAt: application.updatedAt,
    applicantName: lang === "en" ? application.fullNameEn || application.fullNameBn : application.fullNameBn,
    course: {
      code: application.intake.course.code,
      titleBn: application.intake.course.titleBn,
      titleEn: application.intake.course.titleEn,
    },
    intakeYear: application.intake.year,
    events: application.events.map((e) => ({ status: e.status, at: e.createdAt })),
  });
}
