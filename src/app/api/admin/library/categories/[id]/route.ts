import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { libraryCategoryUpdateSchema } from "@/lib/validators/admin-library";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/library/categories/[id] — edit a category (names, parent,
 * sortOrder) or move it within its level (`direction: up|down` swaps
 * sortOrder with the nearest sibling — same scheme as the menus manager).
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "library");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.libraryCategory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "ক্যাটাগরিটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = libraryCategoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join(".") || "_", i.message]));
    return NextResponse.json({ ok: false, error: "ক্যাটাগরির তথ্যগুলো যাচাই করুন।", fields }, { status: 400 });
  }

  const { direction, parentId, ...fields } = parsed.data;

  if (parentId !== undefined && parentId !== null) {
    if (parentId === id) {
      return NextResponse.json({ ok: false, error: "নিজের প্যারেন্ট হওয়া যায় না।" }, { status: 400 });
    }
    const parent = await db.libraryCategory.findUnique({ where: { id: parentId } });
    if (!parent || parent.parentId) {
      return NextResponse.json(
        { ok: false, error: "প্যারেন্ট ক্যাটাগরিটি পাওয়া যায়নি বা এর নিজেই চাইল্ড — দুই স্তরের বেশি অনুমোদিত নয়।" },
        { status: 400 },
      );
    }
  }

  if (direction) {
    // Swap sortOrder with the nearest sibling at the same level.
    const siblings = await db.libraryCategory.findMany({
      where: { parentId: existing.parentId, id: { not: existing.id } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });
    const before = siblings.filter((s) => s.sortOrder < existing.sortOrder);
    const after = siblings.filter((s) => s.sortOrder >= existing.sortOrder);
    const target = direction === "up" ? before[before.length - 1] : after[0];
    if (target) {
      await db.$transaction([
        db.libraryCategory.update({ where: { id: existing.id }, data: { sortOrder: target.sortOrder } }),
        db.libraryCategory.update({ where: { id: target.id }, data: { sortOrder: existing.sortOrder } }),
      ]);
    }
  }

  if (Object.keys(fields).length > 0 || parentId !== undefined) {
    await db.libraryCategory.update({
      where: { id },
      data: {
        ...fields,
        ...(parentId !== undefined ? { parentId: parentId || null } : {}),
      },
    });
  }

  const after = await db.libraryCategory.findUnique({ where: { id } });
  await audit(
    guard.session.user.id,
    "library.category.update",
    "LibraryCategory",
    id,
    { before: { slug: existing.slug, nameBn: existing.nameBn, sortOrder: existing.sortOrder, parentId: existing.parentId }, after },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true, data: { id } });
}

/**
 * DELETE /api/admin/library/categories/[id] — refuse while items are attached
 * (the guard the tests pin); subcategories detach to top level (schema SetNull).
 */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "library");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.libraryCategory.findUnique({
    where: { id },
    include: { _count: { select: { items: true, children: true } } },
  });
  if (!existing) return NextResponse.json({ ok: false, error: "ক্যাটাগরিটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });

  if (existing._count.items > 0) {
    return NextResponse.json(
      { ok: false, error: `এই ক্যাটাগরিতে ${existing._count.items}টি আইটেম আছে — আগে সেগুলো সরান বা মুছুন।` },
      { status: 409 },
    );
  }

  await db.libraryCategory.delete({ where: { id } });
  await audit(
    guard.session.user.id,
    "library.category.delete",
    "LibraryCategory",
    id,
    { before: { slug: existing.slug, nameBn: existing.nameBn, children: existing._count.children } },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true });
}
