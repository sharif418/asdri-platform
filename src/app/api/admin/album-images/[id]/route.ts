import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { albumImageUpdateSchema } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/album-images/[id] — caption + order for one album image. */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.albumImage.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ছবিটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = albumImageUpdateSchema.safeParse(body);
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

  const image = await db.albumImage.update({ where: { id }, data: parsed.data });

  await audit(
    guard.session.user.id,
    "albumImage.update",
    "AlbumImage",
    image.id,
    {
      before: { captionBn: existing.captionBn, sortOrder: existing.sortOrder },
      after: { captionBn: image.captionBn, sortOrder: image.sortOrder },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/album-images/[id] — remove an image from its album. */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.albumImage.findUnique({ where: { id }, include: { media: { select: { filename: true } } } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ছবিটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.albumImage.delete({ where: { id } });
  await audit(
    guard.session.user.id,
    "albumImage.delete",
    "AlbumImage",
    id,
    { before: { albumId: existing.albumId, filename: existing.media.filename, sortOrder: existing.sortOrder } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}
