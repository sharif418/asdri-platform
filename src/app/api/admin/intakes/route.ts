import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const intakeSchema = z.object({
  courseId: z.string().min(1, "কোর্স নির্বাচন করুন"),
  year: z.number().int().min(2020).max(2100),
  sessionBn: z.string().trim().max(120).default(""),
  sessionEn: z.string().trim().max(120).default(""),
  opensAt: z.string().datetime().nullable().optional(),
  closesAt: z.string().datetime().nullable().optional(),
  examDate: z.string().datetime().nullable().optional(),
  seatsTotal: z.number().int().min(0).max(10000).nullable().optional(),
  isPublished: z.boolean().default(false),
  status: z.enum(["UPCOMING", "OPEN", "CLOSED", "PROCESSING"]).default("UPCOMING"),
});

/** POST /api/admin/intakes — create an intake (ADMIN, ADMISSIONS). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "admissions");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = intakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "যাচাই করুন।", fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const course = await db.course.findUnique({ where: { id: d.courseId } });
  if (!course) return NextResponse.json({ ok: false, error: "কোর্স পাওয়া যায়নি।" }, { status: 404 });

  const existing = await db.intake.findUnique({ where: { courseId_year: { courseId: d.courseId, year: d.year } } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "এই বছরের ইনটেক আগেই আছে — সেটি সম্পাদনা করুন।" }, { status: 409 });
  }

  const intake = await db.intake.create({
    data: {
      ...d,
      opensAt: d.opensAt ? new Date(d.opensAt) : null,
      closesAt: d.closesAt ? new Date(d.closesAt) : null,
      examDate: d.examDate ? new Date(d.examDate) : null,
    },
  });
  await audit(guard.session.user.id, "intake.create", "Intake", intake.id, { after: { course: course.code, year: d.year, status: d.status } }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true, data: { id: intake.id } }, { status: 201 });
}
