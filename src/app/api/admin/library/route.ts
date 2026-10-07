import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, getSession, roleCan, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  libraryItemCreateSchema,
  libraryItemListQuerySchema,
  sanitizeLibraryItemPayload,
} from "@/lib/validators/admin-library";
import { buildLibraryItemSlug, deriveJournalKey, resolveLibraryCreatorLinks, upsertLibraryPublisher } from "@/lib/library";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/**
 * GET /api/admin/library — catalogue list for the manager table.
 * Read-only: session + role guard (no CSRF header — safe for plain GETs).
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!roleCan(session.user.role, "library.manage")) return forbidden();

  const url = new URL(request.url);
  const parsed = libraryItemListQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    categoryId: url.searchParams.get("categoryId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "কোয়েরি সঠিক নয়।" }, { status: 400 });
  }

  const where = {
    ...(parsed.data.type ? { type: parsed.data.type } : {}),
    ...(parsed.data.categoryId ? { categoryId: parsed.data.categoryId } : {}),
    ...(parsed.data.q
      ? {
          OR: [
            { titleBn: { contains: parsed.data.q } },
            { titleEn: { contains: parsed.data.q, mode: "insensitive" as const } },
            { slug: { contains: parsed.data.q, mode: "insensitive" as const } },
            { journalNameBn: { contains: parsed.data.q } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    db.libraryItem.count({ where }),
    db.libraryItem.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: PAGE_SIZE,
      include: {
        category: { select: { id: true, nameBn: true, nameEn: true } },
        publisher: { select: { id: true, nameBn: true, nameEn: true } },
        creators: {
          orderBy: { sortOrder: "asc" },
          include: { creator: { select: { id: true, nameBn: true, nameEn: true } } },
        },
        media: { select: { id: true, filename: true, key: true } },
        coverMedia: { select: { id: true, filename: true, key: true } },
        _count: { select: { readings: true, checkouts: true } },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, data: { items, total, pageSize: PAGE_SIZE } });
}

/**
 * POST /api/admin/library — create a catalogue item (ADMIN, LIBRARIAN).
 * Creators arrive as free-text rows and are upserted by name pair; publisher
 * likewise. The slug comes from titleEn || titleBn with -2/-3 suffixing.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "library");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = libraryItemCreateSchema.safeParse(body);
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

  if (data.type !== "JOURNAL_ISSUE" && (data.volume || data.issueLabel)) {
    return NextResponse.json(
      { ok: false, error: "খণ্ড/সংখ্যা ক্ষেত্র শুধু জার্নাল সংখ্যার জন্য।", fields: { volume: "শুধু জার্নাল সংখ্যা" } },
      { status: 400 },
    );
  }

  if (data.categoryId != null) {
    const category = await db.libraryCategory.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) {
      return NextResponse.json({ ok: false, error: "ক্যাটাগরিটি পাওয়া যায়নি।", fields: { categoryId: "ক্যাটাগরি নয়" } }, { status: 400 });
    }
  }

  if (data.coverMediaId != null) {
    const media = await db.media.findUnique({ where: { id: data.coverMediaId }, select: { id: true, kind: true } });
    if (!media || media.kind !== "IMAGE") {
      return NextResponse.json({ ok: false, error: "প্রচ্ছদের জন্য ছবি নির্বাচন করুন।", fields: { coverMediaId: "ছবি নয়" } }, { status: 400 });
    }
  }
  if (data.mediaId != null) {
    const media = await db.media.findUnique({ where: { id: data.mediaId }, select: { id: true, kind: true } });
    if (!media || media.kind !== "DOCUMENT") {
      return NextResponse.json({ ok: false, error: "সংযুক্ত ফাইলটি অবশ্যই ডকুমেন্ট (PDF) হতে হবে।", fields: { mediaId: "ডকুমেন্ট নয়" } }, { status: 400 });
    }
  }

  const publisherId = data.publisher ? (await upsertLibraryPublisher(data.publisher)).id : null;
  const creatorLinks = await resolveLibraryCreatorLinks(data.creators);
  const journalKey = data.type === "JOURNAL_ISSUE" ? deriveJournalKey(data.journalKey, data.journalNameEn, data.journalNameBn) : "";
  const slug = await buildLibraryItemSlug(data.titleEn, data.titleBn);

  const item = await db.libraryItem.create({
    data: {
      slug,
      type: data.type,
      titleBn: data.titleBn,
      titleEn: data.titleEn,
      subtitleBn: data.subtitleBn,
      subtitleEn: data.subtitleEn,
      descriptionBn: data.descriptionBn,
      descriptionEn: data.descriptionEn,
      language: data.language,
      categoryId: data.categoryId ?? null,
      publisherId,
      publishYear: data.publishYear ?? null,
      publishPlaceBn: data.publishPlaceBn,
      isbn: data.isbn || null,
      issn: data.issn || null,
      doi: data.doi || null,
      editionBn: data.editionBn,
      volume: data.volume,
      issueLabel: data.issueLabel,
      journalKey,
      journalNameBn: data.journalNameBn,
      journalNameEn: data.journalNameEn,
      mediaId: data.mediaId ?? null,
      filePages: data.filePages ?? null,
      coverMediaId: data.coverMediaId ?? null,
      externalUrl: data.externalUrl || null,
      visibility: data.visibility,
      isPublished: data.isPublished,
      creators: { create: creatorLinks },
    },
  });

  await audit(
    guard.session.user.id,
    "library.item.create",
    "LibraryItem",
    item.id,
    { after: { slug: item.slug, type: item.type, titleBn: item.titleBn, isPublished: item.isPublished, visibility: item.visibility } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: item.id, slug: item.slug } }, { status: 201 });
}
