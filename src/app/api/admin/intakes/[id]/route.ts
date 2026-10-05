import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const intakeUpdateSchema = z.object({
  sessionBn: z.string().trim().max(120).optional(),
  sessionEn: z.string().trim().max(120).optional(),
  opensAt: z.string().datetime().nullable().optional(),
  closesAt: z.string().datetime().nullable().optional(),
  examDate: z.string().datetime().nullable().optional(),
  seatsTotal: z.number().int().min(0).max(10000).nullable().optional(),
  isPublished: z.boolean().optional(),
  status: z.enum(["UPCOMING", "OPEN", "CLOSED", "PROCESSING"]).optional(),
});

export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "admissions");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.intake.findUnique({ where: { id }, include: { course: { select: { code: true } } } });
  if (!existing) return NextResponse.json({ ok: false, error: "ইনটেক পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = intakeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "যাচাই করুন।" }, { status: 400 });
  }

  const d = parsed.data;
  const intake = await db.intake.update({
    where: { id },
    data: {
      ...d,
      opensAt: d.opensAt !== undefined ? (d.opensAt ? new Date(d.opensAt) : null) : undefined,
      closesAt: d.closesAt !== undefined ? (d.closesAt ? new Date(d.closesAt) : null) : undefined,
      examDate: d.examDate !== undefined ? (d.examDate ? new Date(d.examDate) : null) : undefined,
    },
  });
  await audit(guard.session.user.id, "intake.update", "Intake", id, { before: { status: existing.status, isPublished: existing.isPublished }, after: { status: intake.status, isPublished: intake.isPublished } }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "admissions");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.intake.findUnique({ where: { id }, include: { course: { select: { code: true } }, _count: { select: { applications: true } } } });
  if (!existing) return NextResponse.json({ ok: false, error: "ইনটেক পাওয়া যায়নি।" }, { status: 404 });
  if (existing._count.applications > 0) {
    return NextResponse.json({ ok: false, error: "এই ইনটেকে আবেদন আছে — মুছতে পারা যাবে না।" }, { status: 409 });
  }

  await db.intake.delete({ where: { id } });
  await audit(guard.session.user.id, "intake.delete", "Intake", id, { before: { course: existing.course.code } }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true });
}
