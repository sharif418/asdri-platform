import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, verifyCsrf } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { isFeatureEnabled } from "@/lib/settings";
import { isSameOrigin, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Public application submission (requires an applicant account so the
 * candidate can track status). One active application per intake per user.
 * Round 3: same-origin + CSRF (double-submit) + rate limit — these routes
 * carry national-ID scans, so they get the same guards as admin mutations.
 */

const educationSchema = z.object({
  level: z.string().trim().min(1, "স্তর লিখুন").max(60),
  institution: z.string().trim().max(160).default(""),
  groupOrSubject: z.string().trim().max(160).default(""),
  year: z.number().int().min(1990).max(2100).nullable().optional(),
  result: z.string().trim().max(80).default(""),
  sortOrder: z.number().int().min(0).default(0),
});

const APP_DOC_TYPES = ["NID", "TRANSCRIPT", "CERTIFICATE", "CHARACTER", "OTHER"] as const;

const documentSchema = z.object({
  mediaId: z.string().min(1),
  type: z.enum(APP_DOC_TYPES),
});

const applicationSchema = z.object({
  intakeId: z.string().min(1),
  fullNameBn: z.string().trim().min(3, "বাংলা নাম লিখুন").max(160),
  fullNameEn: z.string().trim().max(160).default(""),
  fatherName: z.string().trim().min(3, "পিতার নাম লিখুন").max(160),
  motherName: z.string().trim().min(3, "মাতার নাম লিখুন").max(160),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "জন্ম তারিখ দিন").optional().nullable(),
  gender: z.enum(["male", "female"]).default("male"),
  nid: z.string().trim().max(40).optional().nullable(),
  phone: z.string().trim().regex(/^01[3-9]\d{8}$/, "১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)"),
  email: z.string().trim().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  presentAddress: z.string().trim().max(400).default(""),
  permanentAddress: z.string().trim().max(400).default(""),
  guardianName: z.string().trim().max(160).default(""),
  guardianPhone: z.string().trim().max(20).default(""),
  guardianRelation: z.string().trim().max(60).default(""),
  photoMediaId: z.string().optional().nullable(),
  documents: z.array(documentSchema).max(10, "সর্বোচ্চ ১০টি ডকুমেন্ট").default([]),
  declarationAccepted: z.literal(true, { message: "ঘোষণাপত্রে সম্মতি দিন" }),
  education: z.array(educationSchema).min(1, "অন্তত একটি শিক্ষাগত যোগ্যতা যোগ করুন").max(8),
});

function trackingNo(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `ASDRI-${year}-${rand}`;
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "অননুমোদিত উৎস।" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "আবেদন করতে অ্যাকাউন্টে লগইন করুন।" }, { status: 401 });
  }

  // Per-USER sliding window (an authenticated route: keying on the account is
  // stricter than IP — IP rotation cannot bypass it).
  const limiter = rateLimit({ key: "admissions-applications", identifier: session.user.id, limit: 5, windowMs: 10 * 60_000 });
  if (!limiter.ok) {
    return NextResponse.json({ ok: false, error: "অনেকবার আবেদনের চেষ্টা হয়েছে, কিছুক্ষণ পর আবার করুন।" }, { status: 429 });
  }

  if (!(await isFeatureEnabled("admissions"))) {
    return NextResponse.json({ ok: false, error: "অনলাইন আবেদন বর্তমানে বন্ধ আছে।" }, { status: 403 });
  }

  if (!verifyCsrf(session.session, request.headers.get("x-csrf-token") ?? "")) {
    return NextResponse.json({ ok: false, error: "নিরাপত্তা টোকেন মেলেনি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।" }, { status: 403 });
  }
  if (session.user.role !== "APPLICANT" && session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "এই অ্যাকাউন্ট দিয়ে আবেদন করা যাবে না।" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "ফর্মের তথ্য যাচাই করুন।", fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const intake = await db.intake.findUnique({ where: { id: d.intakeId }, include: { course: { select: { code: true } } } });
  if (!intake || !intake.isPublished || intake.status !== "OPEN") {
    return NextResponse.json({ ok: false, error: "এই ইনটেকে এখন আবেদন গ্রহণ করা হচ্ছে না।" }, { status: 409 });
  }
  if (intake.closesAt && intake.closesAt < new Date()) {
    return NextResponse.json({ ok: false, error: "আবেদনের সময়সীমা শেষ হয়ে গেছে।" }, { status: 409 });
  }

  const existing = await db.application.findFirst({ where: { intakeId: intake.id, userId: session.user.id } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "আপনি এই ইনটেকে ইতিমধ্যে আবেদন করেছেন।", data: { trackingNo: existing.trackingNo } }, { status: 409 });
  }

  // Uploaded documents must exist, belong to this account, and be documents.
  const docMedia = d.documents.length
    ? await db.media.findMany({
        where: { id: { in: d.documents.map((x) => x.mediaId) }, uploadedById: session.user.id, kind: "DOCUMENT" },
        select: { id: true },
      })
    : [];
  const ownedIds = new Set(docMedia.map((m) => m.id));
  for (const doc of d.documents) {
    if (!ownedIds.has(doc.mediaId)) {
      return NextResponse.json({ ok: false, error: "আপলোড করা ডকুমেন্ট পাওয়া যায়নি — আবার আপলোড করুন।" }, { status: 400 });
    }
  }

  // The photo gets the same ownership + kind check as the documents (round 3:
  // it was previously stored unchecked — any media id could be attached).
  if (d.photoMediaId) {
    const photo = await db.media.findFirst({
      where: { id: d.photoMediaId, uploadedById: session.user.id, kind: "IMAGE" },
      select: { id: true },
    });
    if (!photo) {
      return NextResponse.json({ ok: false, error: "আপলোড করা ছবিটি পাওয়া যায়নি — আবার আপলোড করুন।" }, { status: 400 });
    }
  }

  const application = await db.$transaction(async (tx) => {
    const app = await tx.application.create({
      data: {
        trackingNo: trackingNo(),
        intakeId: intake.id,
        userId: session.user.id,
        fullNameBn: d.fullNameBn,
        fullNameEn: d.fullNameEn,
        fatherName: d.fatherName,
        motherName: d.motherName,
        birthDate: d.birthDate ? new Date(`${d.birthDate}T00:00:00Z`) : null,
        gender: d.gender,
        nid: d.nid ?? null,
        phone: d.phone,
        email: d.email || null,
        presentAddress: d.presentAddress,
        permanentAddress: d.permanentAddress,
        guardianName: d.guardianName,
        guardianPhone: d.guardianPhone,
        guardianRelation: d.guardianRelation,
        photoMediaId: d.photoMediaId ?? null,
        declarationAccepted: true,
        status: "SUBMITTED",
      },
    });
    for (let i = 0; i < d.education.length; i++) {
      const row = d.education[i];
      await tx.applicationEducation.create({
        data: {
          applicationId: app.id,
          level: row.level,
          institution: row.institution,
          groupOrSubject: row.groupOrSubject,
          year: row.year ?? null,
          result: row.result,
          sortOrder: i,
        },
      });
    }
    for (const doc of d.documents) {
      await tx.applicationDocument.create({
        data: { applicationId: app.id, mediaId: doc.mediaId, type: doc.type },
      });
    }
    await tx.applicationEvent.create({
      data: { applicationId: app.id, status: "SUBMITTED", note: "অনলাইন আবেদন জমা হয়েছে।", actorId: session.user.id },
    });
    return app;
  });

  await audit(session.user.id, "application.submit", "Application", application.id, { after: { trackingNo: application.trackingNo, intake: intake.course.code } }, request.headers.get("x-real-ip"));

  return NextResponse.json(
    { ok: true, data: { trackingNo: application.trackingNo, id: application.id } },
    { status: 201 },
  );
}
