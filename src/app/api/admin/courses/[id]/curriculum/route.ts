import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const subjectSchema = z.object({
  code: z.string().trim().max(24).default(""),
  titleBn: z.string().trim().min(2, "বিষয়ের বাংলা নাম আবশ্যক").max(200),
  titleEn: z.string().trim().max(200).default(""),
  modulesBn: z.string().default(""),
  modulesEn: z.string().default(""),
  credits: z.number().int().min(0).max(30).default(0),
  marks: z.number().int().min(0).max(1000).default(0),
  hours: z.number().int().min(0).max(2000).nullable().default(null),
  isNonCredit: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

const semesterSchema = z.object({
  number: z.number().int().min(1).max(20),
  year: z.number().int().min(1).max(6).default(1),
  titleBn: z.string().trim().max(200).default(""),
  titleEn: z.string().trim().max(200).default(""),
  durationBn: z.string().trim().max(80).default(""),
  durationEn: z.string().trim().max(80).default(""),
  subjects: z.array(subjectSchema).max(30).default([]),
});

const curriculumSchema = z.object({
  semesters: z.array(semesterSchema).max(12).default([]),
});

/**
 * PUT /api/admin/courses/[id]/curriculum — replace the whole curriculum tree.
 * The client sends the complete ordered tree; the server rebuilds it inside a
 * transaction so a failed save never leaves a half-edited syllabus.
 */
export async function PUT(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.course.findUnique({ where: { id }, select: { id: true, code: true } });
  if (!existing) return NextResponse.json({ ok: false, error: "কোর্স পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = curriculumSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "কারিকুলাম যাচাই করুন।", fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])) },
      { status: 400 },
    );
  }

  const semesters = parsed.data.semesters;
  const totalSubjects = semesters.reduce((sum, s) => sum + s.subjects.length, 0);
  const totalCredits = semesters.reduce((sum, s) => sum + s.subjects.reduce((x, sub) => x + (sub.isNonCredit ? 0 : sub.credits), 0), 0);

  await db.$transaction(async (tx) => {
    await tx.semester.deleteMany({ where: { courseId: id } });
    for (let i = 0; i < semesters.length; i++) {
      const sem = semesters[i];
      const semRow = await tx.semester.create({
        data: {
          courseId: id,
          number: sem.number,
          year: sem.year,
          titleBn: sem.titleBn,
          titleEn: sem.titleEn,
          durationBn: sem.durationBn,
          durationEn: sem.durationEn,
        },
      });
      for (const subject of sem.subjects) {
        await tx.subject.create({
          data: {
            semesterId: semRow.id,
            ...subject,
          },
        });
      }
    }
  });

  await audit(
    guard.session.user.id,
    "course.curriculum",
    "Course",
    id,
    { after: { semesters: semesters.length, subjects: totalSubjects, credits: totalCredits } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { semesters: semesters.length, subjects: totalSubjects, credits: totalCredits } });
}
