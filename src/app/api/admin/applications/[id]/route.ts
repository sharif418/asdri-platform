import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** The officer's status machine — one PATCH per transition, always audited. */
const statusSchema = z.object({
  status: z.enum([
    "UNDER_REVIEW",
    "SHORTLISTED",
    "EXAM_SCHEDULED",
    "EXAM_TAKEN",
    "INTERVIEW",
    "ADMITTED",
    "WAITLISTED",
    "REJECTED",
  ]),
  note: z.string().trim().max(400).default(""),
  examScore: z.number().int().min(0).max(100).nullable().optional(),
  vivaScore: z.number().int().min(0).max(100).nullable().optional(),
  reviewNote: z.string().trim().max(1000).optional(),
});

export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "admissions");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.application.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "আবেদন পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "যাচাই করুন।" }, { status: 400 });
  }

  const d = parsed.data;
  const application = await db.$transaction(async (tx) => {
    const app = await tx.application.update({
      where: { id },
      data: {
        status: d.status,
        ...(d.reviewNote !== undefined ? { reviewNote: d.reviewNote } : {}),
        ...(d.examScore !== undefined ? { examScore: d.examScore } : {}),
        ...(d.vivaScore !== undefined ? { vivaScore: d.vivaScore } : {}),
      },
    });
    await tx.applicationEvent.create({
      data: { applicationId: id, status: d.status, note: d.note, actorId: guard.session.user.id },
    });
    return app;
  });

  await audit(
    guard.session.user.id,
    "application.status",
    "Application",
    id,
    { before: { status: existing.status }, after: { status: application.status, note: d.note } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { status: application.status } });
}
