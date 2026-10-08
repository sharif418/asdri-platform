import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCsrf, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { zodFields } from "@/lib/validators";
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security";
import { LOOKUP_LIMITS, TRACKING_NO_RE, lookupMismatch, normalizePhone, phonesMatch } from "@/lib/self-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal/guardian/link — the guardian's own child-link
 * (round-10; restores the lost round-7 E.19 close).
 *
 * The guardian proves parenthood with BOTH halves of what the office already
 * holds: the tracking number (shown to the family at submit time) and the
 * family phone on the application (guardianPhone, falling back to the
 * applicant's own). Passing both creates the GuardianLink — the same relation
 * the office would set, with the relation label from the application itself.
 *
 * Security shape (mirrors the public status-lookup exactly):
 *   - session + GUARDIAN role + CSRF + same-origin
 *   - lookup-grade rate limit, keyed per ACCOUNT (tighter than a public
 *     bucket — a signed-in account probing numbers is the scarier actor)
 *   - anti-enumeration: unknown number, unsubmitted draft, and wrong phone
 *     all answer with ONE identical 404 — an attacker cannot tell which
 *     half failed, or whether the number exists at all
 *   - the 409 (already linked elsewhere) fires ONLY after the phone factor
 *     passed, so the conflict answer can never be used as a probe
 *   - same-guardian repeats are idempotent (200, no duplicate row)
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
});

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "অননুমোদিত উৎস।" }, { status: 403 });
  }

  const session = await requireCsrf(request);
  if (!session) return unauthorized();
  if (session.user.role !== "GUARDIAN") return forbidden();

  // lookup-grade, keyed per account (a signed-in prober is the scarier actor)
  const limited = rateLimit({
    key: "portal-guardian-link",
    identifier: session.user.id,
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
    return NextResponse.json({ ok: false, error: "অনুরোধ পড়া যায়নি।" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "সঠিক তথ্য দিন।", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  const { trackingNo, phone } = parsed.data;
  const guardianId = session.user.id;

  const application = await db.application.findUnique({
    where: { trackingNo },
    select: {
      id: true,
      status: true,
      fullNameBn: true,
      phone: true,
      guardianPhone: true,
      guardianRelation: true,
      guardianLinks: { select: { id: true, guardianUserId: true } },
    },
  });

  // Unknown number, unsubmitted draft, or wrong family phone — one identical
  // answer for all three (the family phone falls back to the applicant's own).
  const familyPhone = application?.guardianPhone || application?.phone;
  if (
    !application ||
    application.status === "DRAFT" ||
    !phonesMatch(familyPhone, phone)
  ) {
    return NextResponse.json({ ok: false, error: lookupMismatch(true) }, { status: 404 });
  }

  // The factor passed — now the conflict rules may speak.
  const existing = application.guardianLinks[0];
  if (existing && existing.guardianUserId === guardianId) {
    // idempotent: the same guardian linking the same child again
    return NextResponse.json({
      ok: true,
      data: { studentNameBn: application.fullNameBn, already: true },
    });
  }
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "এই আবেদনটি ইতিমধ্যে অন্য অভিভাবকের সঙ্গে যুক্ত — অফিসে জানান।" },
      { status: 409 },
    );
  }

  const link = await db.guardianLink.create({
    data: {
      guardianUserId: guardianId,
      applicationId: application.id,
      studentNameBn: application.fullNameBn,
      relation: application.guardianRelation.trim() || "অভিভাবক",
    },
  });

  await audit(
    guardianId,
    "guardianLink.self",
    "GuardianLink",
    link.id,
    { after: { trackingNo, studentNameBn: application.fullNameBn, relation: link.relation } },
    getClientIp(request),
  );

  return NextResponse.json(
    { ok: true, data: { studentNameBn: application.fullNameBn, relation: link.relation, already: false } },
    { status: 201 },
  );
}
