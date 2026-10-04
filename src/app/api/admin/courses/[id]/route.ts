import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sanitizeRichText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const courseUpdateSchema = z.object({
  code: z.string().trim().min(2).max(12).optional(),
  titleBn: z.string().trim().min(3).max(300).optional(),
  titleEn: z.string().trim().max(300).optional(),
  titleAr: z.string().trim().max(300).nullable().optional(),
  taglineBn: z.string().trim().max(500).optional(),
  taglineEn: z.string().trim().max(500).optional(),
  overviewBn: z.string().optional(),
  overviewEn: z.string().optional(),
  objectivesBn: z.string().optional(),
  objectivesEn: z.string().optional(),
  eligibilityBn: z.string().optional(),
  eligibilityEn: z.string().optional(),
  careerBn: z.string().optional(),
  careerEn: z.string().optional(),
  durationBn: z.string().trim().max(120).optional(),
  durationEn: z.string().trim().max(120).optional(),
  courseTypeBn: z.string().trim().max(200).optional(),
  courseTypeEn: z.string().trim().max(200).optional(),
  seats: z.number().int().min(0).max(10000).nullable().optional(),
  coverMediaId: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

/** PATCH /api/admin/courses/[id] — update course metadata (ADMIN, EDITOR). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.course.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "কোর্স পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = courseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "ফর্ম যাচাই করুন।", fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])) },
      { status: 400 },
    );
  }

  // sanitise rich-text fields
  const d = parsed.data;
  for (const key of ["overviewBn", "overviewEn", "objectivesBn", "objectivesEn", "eligibilityBn", "eligibilityEn", "careerBn", "careerEn"] as const) {
    if (d[key] !== undefined) {
      d[key] = sanitizeRichText(d[key] ?? "");
    }
  }

  const course = await db.course.update({ where: { id }, data: d });
  await audit(
    guard.session.user.id,
    "course.update",
    "Course",
    course.id,
    { before: { titleBn: existing.titleBn, isPublished: existing.isPublished }, after: { titleBn: course.titleBn, isPublished: course.isPublished } },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true, data: { slug: course.slug } });
}

/** DELETE /api/admin/courses/[id] — remove a course and its tree. */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.course.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "কোর্স পাওয়া যায়নি।" }, { status: 404 });

  if (await db.intake.count({ where: { courseId: id } }) > 0) {
    return NextResponse.json({ ok: false, error: "এই কোর্সে ভর্তি ইনটেক আছে — আগে সেগুলো মুছুন।" }, { status: 409 });
  }

  await db.course.delete({ where: { id } });
  await audit(guard.session.user.id, "course.delete", "Course", id, { before: { code: existing.code, titleBn: existing.titleBn } }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true });
}
