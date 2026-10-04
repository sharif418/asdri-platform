import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const specializationSchema = z.object({
  nameBn: z.string().trim().min(2).max(200),
  nameEn: z.string().trim().max(200).default(""),
  nameAr: z.string().trim().max(200).nullable().default(null),
  sortOrder: z.number().int().min(0).default(0),
});

const bodySchema = z.object({
  specializations: z.array(specializationSchema).max(12).default([]),
});

/** PUT /api/admin/courses/[id]/specializations — rebuild the তাখাসসুস list. */
export async function PUT(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.course.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ ok: false, error: "কোর্স পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "যাচাই করুন।" }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.courseSpecialization.deleteMany({ where: { courseId: id } });
    for (const spec of parsed.data.specializations) {
      await tx.courseSpecialization.create({ data: { courseId: id, ...spec } });
    }
  });

  await audit(guard.session.user.id, "course.specializations", "Course", id, { after: { count: parsed.data.specializations.length } }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true, data: { count: parsed.data.specializations.length } });
}
