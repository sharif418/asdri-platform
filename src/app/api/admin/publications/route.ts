import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { publicationCreateSchema, sanitizePublicationPayload } from "@/lib/validators/admin-research";

export const dynamic = "force-dynamic";

/** POST /api/admin/publications — create a journal/book/bulletin (ADMIN, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = publicationCreateSchema.safeParse(body);
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

  const data = sanitizePublicationPayload(parsed.data);

  if (data.coverMediaId != null) {
    const media = await db.media.findUnique({ where: { id: data.coverMediaId }, select: { id: true, kind: true } });
    if (!media || media.kind !== "IMAGE") {
      return NextResponse.json({ ok: false, error: "প্রচ্ছদের জন্য ছবি নির্বাচন করুন।", fields: { coverMediaId: "ছবি নয়" } }, { status: 400 });
    }
  }
  if (data.fileMediaId != null) {
    const media = await db.media.findUnique({ where: { id: data.fileMediaId }, select: { id: true, kind: true } });
    if (!media || media.kind !== "DOCUMENT") {
      return NextResponse.json({ ok: false, error: "সংযুক্ত ফাইলটি অবশ্যই ডকুমেন্ট (PDF) হতে হবে।", fields: { fileMediaId: "ডকুমেন্ট নয়" } }, { status: 400 });
    }
  }

  const slug = await uniqueSlug(data.titleEn || data.titleBn);
  const publication = await db.publication.create({
    data: {
      slug,
      titleBn: data.titleBn,
      titleEn: data.titleEn,
      abstractBn: data.abstractBn,
      abstractEn: data.abstractEn,
      authorsBn: data.authorsBn,
      authorsEn: data.authorsEn,
      kind: data.kind,
      year: data.year,
      isbn: data.isbn || null,
      issn: data.issn || null,
      coverMediaId: data.coverMediaId ?? null,
      fileMediaId: data.fileMediaId ?? null,
      sortOrder: data.sortOrder,
      isPublished: data.isPublished,
    },
  });

  await audit(
    guard.session.user.id,
    "publication.create",
    "Publication",
    publication.id,
    { after: { slug: publication.slug, titleBn: publication.titleBn, kind: publication.kind, year: publication.year } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: publication.slug, id: publication.id } }, { status: 201 });
}

/** Ensure a unique publication slug (-2, -3… suffixes). */
async function uniqueSlug(source: string): Promise<string> {
  const base = slugify(source) || "publication";
  let candidate = base;
  for (let attempt = 2; attempt <= 25; attempt++) {
    const existing = await db.publication.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${base}-${attempt}`;
  }
  return `${base}-${Date.now()}`;
}
