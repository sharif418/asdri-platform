import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { invalidateSiteMenus } from "@/lib/content/menus";
import { menuUpdateSchema } from "@/lib/validators/admin-settings";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/menus/[id] — edit an item (labels, href, visibility,
 * flagKey, parent) or move it within its location (`direction: up|down`
 * swaps sortOrder with the neighbour).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const guard = await requireModule(request, "menus");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.menuItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "মেনু আইটেমটি পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = menuUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join(".") || "_", i.message]));
    return NextResponse.json({ ok: false, error: "মেনু আইটেমের তথ্যগুলো যাচাই করুন।", fields }, { status: 400 });
  }

  const { direction, parentId, ...fields } = parsed.data;

  if (parentId !== undefined && parentId) {
    if (parentId === id) {
      return NextResponse.json({ ok: false, error: "নিজের প্যারেন্ট হওয়া যায় না।" }, { status: 400 });
    }
    const parent = await db.menuItem.findUnique({ where: { id: parentId } });
    if (!parent || parent.parentId) {
      return NextResponse.json(
        { ok: false, error: "প্যারেন্ট মেনুটি পাওয়া যায়নি বা এর নিজেই চাইল্ড — দুই স্তরের বেশি অনুমোদিত নয়।" },
        { status: 400 },
      );
    }
  }

  if (direction) {
    // Swap sortOrder with the nearest neighbour in the same location+parent.
    const neighbours = await db.menuItem.findMany({
      where: {
        location: existing.location,
        parentId: existing.parentId,
        id: { not: existing.id },
      },
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });
    const before = neighbours.filter((n) => n.sortOrder < existing.sortOrder);
    const after = neighbours.filter((n) => n.sortOrder >= existing.sortOrder);
    const target = direction === "up" ? before[before.length - 1] : after[0];
    if (target) {
      await db.$transaction([
        db.menuItem.update({ where: { id: existing.id }, data: { sortOrder: target.sortOrder } }),
        db.menuItem.update({ where: { id: target.id }, data: { sortOrder: existing.sortOrder } }),
      ]);
    }
  }

  if (Object.keys(fields).length > 0 || parentId !== undefined) {
    await db.menuItem.update({
      where: { id },
      data: {
        ...fields,
        ...(parentId !== undefined ? { parentId: parentId || null } : {}),
      },
    });
  }

  invalidateSiteMenus();
  const after = await db.menuItem.findUnique({ where: { id } });
  await audit(
    guard.session.user.id,
    "menu.update",
    "MenuItem",
    id,
    { before: existing, after },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true, data: { id } });
}

/** DELETE /api/admin/menus/[id] — remove an item (children cascade per schema). */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const guard = await requireModule(request, "menus");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.menuItem.findUnique({ where: { id }, include: { _count: { select: { children: true } } } });
  if (!existing) return NextResponse.json({ ok: false, error: "মেনু আইটেমটি পাওয়া যায়নি।" }, { status: 404 });

  if (existing._count.children > 0) {
    return NextResponse.json(
      { ok: false, error: `এই আইটেমের নিচে ${existing._count.children}টি সাব-মেনু আছে — আগে সেগুলো সরান বা মুছুন।` },
      { status: 409 },
    );
  }

  await db.menuItem.delete({ where: { id } });
  invalidateSiteMenus();
  await audit(guard.session.user.id, "menu.delete", "MenuItem", id, { before: existing }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true });
}
