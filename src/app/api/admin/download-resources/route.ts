import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { downloadResourceCreateSchema } from "@/lib/validators/admin-research";

export const dynamic = "force-dynamic";

/** POST /api/admin/download-resources — create a download item (ADMIN, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = downloadResourceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "ফর্মের তথ্য যাচাই করুন।",
        fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  if (data.fileMediaId != null) {
    const media = await db.media.findUnique({ where: { id: data.fileMediaId }, select: { id: true, kind: true } });
    if (!media || media.kind !== "DOCUMENT") {
      return NextResponse.json({ ok: false, error: "সংযুক্ত ফাইলটি অবশ্যই ডকুমেন্ট (PDF) হতে হবে।", fields: { fileMediaId: "ডকুমেন্ট নয়" } }, { status: 400 });
    }
  }
  if (data.courseId != null) {
    const course = await db.course.findUnique({ where: { id: data.courseId }, select: { id: true } });
    if (!course) {
      return NextResponse.json({ ok: false, error: "নির্বাচিত কোর্সটি খুঁজে পাওয়া যায়নি।", fields: { courseId: "কোর্স নেই" } }, { status: 400 });
    }
  }

  const resource = await db.downloadResource.create({
    data: {
      titleBn: data.titleBn,
      titleEn: data.titleEn,
      descriptionBn: data.descriptionBn,
      descriptionEn: data.descriptionEn,
      categoryBn: data.categoryBn,
      categoryEn: data.categoryEn,
      fileMediaId: data.fileMediaId ?? null,
      courseId: data.courseId ?? null,
      sortOrder: data.sortOrder,
      isPublished: data.isPublished,
    },
  });

  await audit(
    guard.session.user.id,
    "downloadResource.create",
    "DownloadResource",
    resource.id,
    { after: { titleBn: resource.titleBn, categoryBn: resource.categoryBn, isPublished: resource.isPublished } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: resource.id } }, { status: 201 });
}
