import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { libraryItemUpdateSchema, sanitizeLibraryItemPayload } from "@/lib/validators/admin-library";
import { deriveJournalKey, resolveLibraryCreatorLinks, upsertLibraryPublisher } from "@/lib/library";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/library/[id] — update an item. The slug stays stable (public
 * reader URLs must not move); `creators`/`publisher` replace wholesale when sent.
 * Links, checkouts and readings cascade at the database level on delete.
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "library");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.libraryItem.findUnique({ where: { id }, include: { creators: true } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "আইটেমটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = libraryItemUpdateSchema.safeParse(body);
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

  const data = sanitizeLibraryItemPayload(parsed.data);
  const { creators, publisher, categoryId, mediaId, coverMediaId, filePages, publishYear, isbn, issn, doi, externalUrl, journalKey, journalNameBn, journalNameEn, volume, issueLabel, ...scalarFields } = data;

  if (data.type !== undefined && data.type !== "JOURNAL_ISSUE" && (volume || issueLabel)) {
    return NextResponse.json(
      { ok: false, error: "খণ্ড/সংখ্যা ক্ষেত্র শুধু জার্নাল সংখ্যার জন্য।", fields: { volume: "শুধু জার্নাল সংখ্যা" } },
      { status: 400 },
    );
  }

  if (categoryId !== undefined && categoryId !== null) {
    const category = await db.libraryCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) {
      return NextResponse.json({ ok: false, error: "ক্যাটাগরিটি পাওয়া যায়নি।", fields: { categoryId: "ক্যাটাগরি নয়" } }, { status: 400 });
    }
  }

  if (coverMediaId != null) {
    const media = await db.media.findUnique({ where: { id: coverMediaId }, select: { id: true, kind: true } });
    if (!media || media.kind !== "IMAGE") {
      return NextResponse.json({ ok: false, error: "প্রচ্ছদের জন্য ছবি নির্বাচন করুন।", fields: { coverMediaId: "ছবি নয়" } }, { status: 400 });
    }
  }
  if (mediaId != null) {
    const media = await db.media.findUnique({ where: { id: mediaId }, select: { id: true, kind: true } });
    if (!media || media.kind !== "DOCUMENT") {
      return NextResponse.json({ ok: false, error: "সংযুক্ত ফাইলটি অবশ্যই ডকুমেন্ট (PDF) হতে হবে।", fields: { mediaId: "ডকুমেন্ট নয়" } }, { status: 400 });
    }
  }

  // Type + journal fields interact: recompute journalKey whenever any of them moves.
  const nextType = data.type ?? existing.type;
  const nextJournalNameBn = journalNameBn ?? existing.journalNameBn;
  const nextJournalNameEn = journalNameEn ?? existing.journalNameEn;
  const nextJournalKey =
    nextType === "JOURNAL_ISSUE" ? deriveJournalKey(journalKey ?? existing.journalKey, nextJournalNameEn, nextJournalNameBn) : "";

  const item = await db.libraryItem.update({
    where: { id },
    data: {
      ...scalarFields,
      ...(categoryId !== undefined ? { categoryId: categoryId ?? null } : {}),
      ...(publishYear !== undefined ? { publishYear: publishYear ?? null } : {}),
      ...(mediaId !== undefined ? { mediaId: mediaId ?? null } : {}),
      ...(coverMediaId !== undefined ? { coverMediaId: coverMediaId ?? null } : {}),
      ...(filePages !== undefined ? { filePages: filePages ?? null } : {}),
      ...(isbn !== undefined ? { isbn: isbn || null } : {}),
      ...(issn !== undefined ? { issn: issn || null } : {}),
      ...(doi !== undefined ? { doi: doi || null } : {}),
      ...(externalUrl !== undefined ? { externalUrl: externalUrl || null } : {}),
      ...(journalKey !== undefined || journalNameBn !== undefined || journalNameEn !== undefined || data.type !== undefined
        ? { journalKey: nextJournalKey }
        : {}),
      ...(publisher !== undefined ? { publisherId: publisher ? (await upsertLibraryPublisher(publisher)).id : null } : {}),
    },
  });

  // Creators replace wholesale (order preserved, roles re-sent every time).
  if (creators !== undefined) {
    const links = await resolveLibraryCreatorLinks(creators);
    await db.$transaction([
      db.libraryItemCreator.deleteMany({ where: { itemId: id } }),
      db.libraryItemCreator.createMany({ data: links.map((link) => ({ ...link, itemId: id })) }),
    ]);
  }

  await audit(
    guard.session.user.id,
    "library.item.update",
    "LibraryItem",
    item.id,
    {
      before: { slug: existing.slug, titleBn: existing.titleBn, isPublished: existing.isPublished, visibility: existing.visibility },
      after: { slug: item.slug, titleBn: item.titleBn, isPublished: item.isPublished, visibility: item.visibility },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: item.id, slug: item.slug } });
}

/** DELETE /api/admin/library/[id] — remove an item; links/checkouts/readings cascade. */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "library");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.libraryItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "আইটেমটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.libraryItem.delete({ where: { id } });
  await audit(
    guard.session.user.id,
    "library.item.delete",
    "LibraryItem",
    id,
    { before: { slug: existing.slug, titleBn: existing.titleBn, type: existing.type } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}
