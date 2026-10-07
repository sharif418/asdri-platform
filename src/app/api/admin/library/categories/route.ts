import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, getSession, roleCan, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { buildUniqueSlug, slugify } from "@/lib/slug";
import { libraryCategoryCreateSchema } from "@/lib/validators/admin-library";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/library/categories — flat list for the tree manager
 * (the UI nests by parentId). Read-only: session + role guard, no CSRF.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!roleCan(session.user.role, "library.manage")) return forbidden();

  const categories = await db.libraryCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { items: true, children: true } },
    },
  });

  return NextResponse.json({ ok: true, data: { items: categories } });
}

/** POST /api/admin/library/categories — add a category (top level or child). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "library");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = libraryCategoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join(".") || "_", i.message]));
    return NextResponse.json({ ok: false, error: "ক্যাটাগরির তথ্যগুলো যাচাই করুন।", fields }, { status: 400 });
  }

  // A child must hang off a top-level parent — the tree is two levels deep.
  if (parsed.data.parentId) {
    const parent = await db.libraryCategory.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent || parent.parentId) {
      return NextResponse.json(
        { ok: false, error: "প্যারেন্ট ক্যাটাগরিটি পাওয়া যায়নি বা এর নিজেই চাইল্ড — দুই স্তরের বেশি অনুমোদিত নয়।" },
        { status: 400 },
      );
    }
  }

  const slug = await buildUniqueSlug(slugify(parsed.data.nameEn || parsed.data.nameBn), async (candidate) => {
    const existing = await db.libraryCategory.findUnique({ where: { slug: candidate }, select: { id: true } });
    return !!existing;
  });

  const row = await db.libraryCategory.create({
    data: {
      slug,
      nameBn: parsed.data.nameBn,
      nameEn: parsed.data.nameEn,
      parentId: parsed.data.parentId ?? null,
      sortOrder: parsed.data.sortOrder,
    },
  });

  await audit(
    guard.session.user.id,
    "library.category.create",
    "LibraryCategory",
    row.id,
    { after: { slug: row.slug, nameBn: row.nameBn, parentId: row.parentId } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: row.id, slug: row.slug } }, { status: 201 });
}
