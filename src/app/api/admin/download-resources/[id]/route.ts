import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { downloadResourceUpdateSchema } from "@/lib/validators/admin-research";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/download-resources/[id] — update a download item (ADMIN, EDITOR). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.downloadResource.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ডাউনলোড আইটেমটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = downloadResourceUpdateSchema.safeParse(body);
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
  const { fileMediaId, courseId, ...rest } = data;

  if (fileMediaId != null) {
    const media = await db.media.findUnique({ where: { id: fileMediaId }, select: { id: true, kind: true } });
    if (!media || media.kind !== "DOCUMENT") {
      return NextResponse.json({ ok: false, error: "সংযুক্ত ফাইলটি অবশ্যই ডকুমেন্ট (PDF) হতে হবে।", fields: { fileMediaId: "ডকুমেন্ট নয়" } }, { status: 400 });
    }
  }
  if (courseId != null) {
    const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) {
      return NextResponse.json({ ok: false, error: "নির্বাচিত কোর্সটি খুঁজে পাওয়া যায়নি।", fields: { courseId: "কোর্স নেই" } }, { status: 400 });
    }
  }

  const resource = await db.downloadResource.update({
    where: { id },
    data: {
      ...rest,
      ...(fileMediaId !== undefined ? { fileMediaId: fileMediaId ?? null } : {}),
      ...(courseId !== undefined ? { courseId: courseId ?? null } : {}),
    },
  });

  await audit(
    guard.session.user.id,
    "downloadResource.update",
    "DownloadResource",
    resource.id,
    {
      before: { titleBn: existing.titleBn, isPublished: existing.isPublished },
      after: { titleBn: resource.titleBn, isPublished: resource.isPublished },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: resource.id } });
}

/** DELETE /api/admin/download-resources/[id] — remove a download item (ADMIN, EDITOR). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.downloadResource.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ডাউনলোড আইটেমটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.downloadResource.delete({ where: { id } });
  await audit(
    guard.session.user.id,
    "downloadResource.delete",
    "DownloadResource",
    id,
    { before: { titleBn: existing.titleBn, categoryBn: existing.categoryBn } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}
