import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const sdpSchema = z.object({
  titleBn: z.string().trim().min(2).max(200),
  titleEn: z.string().trim().max(200).default(""),
  objectiveBn: z.string().trim().max(300).default(""),
  objectiveEn: z.string().trim().max(300).default(""),
  activitiesBn: z.string().trim().max(300).default(""),
  activitiesEn: z.string().trim().max(300).default(""),
  hours: z.number().int().min(0).max(2000).default(0),
  outcomeBn: z.string().trim().max(200).default(""),
  outcomeEn: z.string().trim().max(200).default(""),
  sortOrder: z.number().int().min(0).default(0),
});

const bodySchema = z.object({ programs: z.array(sdpSchema).max(20).default([]) });

/** PUT /api/admin/courses/[id]/sdp — rebuild the student-development list. */
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
    await tx.sdpProgram.deleteMany({ where: { courseId: id } });
    for (const program of parsed.data.programs) {
      await tx.sdpProgram.create({ data: { courseId: id, ...program } });
    }
  });

  await audit(guard.session.user.id, "course.sdp", "Course", id, { after: { count: parsed.data.programs.length } }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true, data: { count: parsed.data.programs.length } });
}
