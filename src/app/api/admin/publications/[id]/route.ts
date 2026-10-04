import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { publicationUpdateSchema, sanitizePublicationPayload } from "@/lib/validators/admin-research";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/publications/[id] — update a publication (ADMIN, EDITOR). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.publication.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "প্রকাশনাটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = publicationUpdateSchema.safeParse(body);
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
  const { coverMediaId, fileMediaId, isbn, issn, ...rest } = data;

  if (coverMediaId != null) {
    const media = await db.media.findUnique({ where: { id: coverMediaId }, select: { id: true, kind: true } });
    if (!media || media.kind !== "IMAGE") {
      return NextResponse.json({ ok: false, error: "প্রচ্ছদের জন্য ছবি নির্বাচন করুন।", fields: { coverMediaId: "ছবি নয়" } }, { status: 400 });
    }
  }
  if (fileMediaId != null) {
    const media = await db.media.findUnique({ where: { id: fileMediaId }, select: { id: true, kind: true } });
    if (!media || media.kind !== "DOCUMENT") {
      return NextResponse.json({ ok: false, error: "সংযুক্ত ফাইলটি অবশ্যই ডকুমেন্ট (PDF) হতে হবে।", fields: { fileMediaId: "ডকুমেন্ট নয়" } }, { status: 400 });
    }
  }

  const publication = await db.publication.update({
    where: { id },
    data: {
      ...rest,
      ...(isbn !== undefined ? { isbn: isbn || null } : {}),
      ...(issn !== undefined ? { issn: issn || null } : {}),
      ...(coverMediaId !== undefined ? { coverMediaId: coverMediaId ?? null } : {}),
      ...(fileMediaId !== undefined ? { fileMediaId: fileMediaId ?? null } : {}),
    },
  });

  await audit(
    guard.session.user.id,
    "publication.update",
    "Publication",
    publication.id,
    {
      before: { slug: existing.slug, titleBn: existing.titleBn, isPublished: existing.isPublished },
      after: { slug: publication.slug, titleBn: publication.titleBn, isPublished: publication.isPublished },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: publication.slug } });
}

/** DELETE /api/admin/publications/[id] — remove a publication (ADMIN, EDITOR). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.publication.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "প্রকাশনাটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.publication.delete({ where: { id } });
  await audit(
    guard.session.user.id,
    "publication.delete",
    "Publication",
    id,
    { before: { slug: existing.slug, titleBn: existing.titleBn, kind: existing.kind } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}
