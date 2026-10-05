import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { albumUpdateSchema } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/albums/[id] — update album fields (ADMIN, EDITOR). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.album.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "অ্যালবামটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = albumUpdateSchema.safeParse(body);
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
  if (data.slug !== undefined && data.slug !== existing.slug && (await db.album.findUnique({ where: { slug: data.slug } }))) {
    return NextResponse.json({ ok: false, error: "এই স্লাগ ইতিমধ্যেই ব্যবহৃত।", fields: { slug: "স্লাগ ডুপ্লিকেট" } }, { status: 409 });
  }
  if (data.coverMediaId && !(await db.media.findUnique({ where: { id: data.coverMediaId } }))) {
    return NextResponse.json({ ok: false, error: "নির্বাচিত কভার ছবি খুঁজে পাওয়া যায়নি।", fields: { coverMediaId: "মিডিয়া নেই" } }, { status: 400 });
  }

  const { coverMediaId, ...rest } = data;
  const album = await db.album.update({
    where: { id },
    data: { ...rest, ...(coverMediaId !== undefined ? { coverMediaId: coverMediaId ?? null } : {}) },
  });

  await audit(
    guard.session.user.id,
    "album.update",
    "Album",
    album.id,
    {
      before: { titleBn: existing.titleBn, isPublished: existing.isPublished },
      after: { titleBn: album.titleBn, isPublished: album.isPublished },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: album.slug } });
}

/** DELETE /api/admin/albums/[id] — remove album + its images (ADMIN, EDITOR). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.album.findUnique({ where: { id }, include: { _count: { select: { images: true } } } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "অ্যালবামটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.album.delete({ where: { id } }); // AlbumImage rows cascade
  await audit(
    guard.session.user.id,
    "album.delete",
    "Album",
    id,
    { before: { titleBn: existing.titleBn, slug: existing.slug, images: existing._count.images } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}
