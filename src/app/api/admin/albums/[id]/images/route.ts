import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { albumImagesAddSchema } from "@/lib/validators/admin-content";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/albums/[id]/images — append images to an album. */
export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const album = await db.album.findUnique({ where: { id } });
  if (!album) {
    return NextResponse.json({ ok: false, error: "অ্যালবামটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = albumImagesAddSchema.safeParse(body);
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

  const mediaIds = parsed.data.mediaIds;
  const mediaRows = await db.media.findMany({ where: { id: { in: mediaIds }, kind: "IMAGE" }, select: { id: true } });
  const validIds = mediaRows.map((row) => row.id);
  if (validIds.length === 0) {
    return NextResponse.json({ ok: false, error: "কোনো বৈধ ছবি পাওয়া যায়নি (শুধু IMAGE ধরন যোগ করা যায়)।" }, { status: 400 });
  }

  // skip images already in this album (idempotent add)
  const existingRows = await db.albumImage.findMany({ where: { albumId: id, mediaId: { in: validIds } }, select: { mediaId: true } });
  const existingIds = new Set(existingRows.map((row) => row.mediaId));
  const freshIds = validIds.filter((mediaId) => !existingIds.has(mediaId));

  const last = await db.albumImage.findFirst({ where: { albumId: id }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const baseOrder = (last?.sortOrder ?? -1) + 1;

  if (freshIds.length > 0) {
    const data: Prisma.AlbumImageCreateManyInput[] = freshIds.map((mediaId, index) => ({
      albumId: id,
      mediaId,
      captionBn: "",
      captionEn: "",
      sortOrder: baseOrder + index,
    }));
    await db.albumImage.createMany({ data });
  }

  await audit(
    guard.session.user.id,
    "albumImage.add",
    "Album",
    id,
    { after: { added: freshIds.length, skippedDuplicates: validIds.length - freshIds.length } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { added: freshIds.length } }, { status: 201 });
}
