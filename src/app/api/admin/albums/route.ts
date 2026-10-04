import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { albumCreateSchema } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

/** POST /api/admin/albums — create an album (ADMIN, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = albumCreateSchema.safeParse(body);
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
  const slug = data.slug || slugify(data.titleEn || data.titleBn);
  if (await db.album.findUnique({ where: { slug } })) {
    return NextResponse.json({ ok: false, error: "এই স্লাগ ইতিমধ্যেই ব্যবহৃত — অন্য একটি দিন।", fields: { slug: "স্লাগ ডুপ্লিকেট" } }, { status: 409 });
  }
  if (data.coverMediaId && !(await db.media.findUnique({ where: { id: data.coverMediaId } }))) {
    return NextResponse.json({ ok: false, error: "নির্বাচিত কভার ছবি খুঁজে পাওয়া যায়নি।", fields: { coverMediaId: "মিডিয়া নেই" } }, { status: 400 });
  }

  const { coverMediaId, ...rest } = data;
  const album = await db.album.create({
    data: { ...rest, slug, ...(coverMediaId !== undefined ? { coverMediaId: coverMediaId ?? null } : {}) },
  });

  await audit(
    guard.session.user.id,
    "album.create",
    "Album",
    album.id,
    { after: { titleBn: album.titleBn, slug: album.slug, isPublished: album.isPublished } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: album.slug, id: album.id } }, { status: 201 });
}
