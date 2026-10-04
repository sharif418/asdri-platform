import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fatwaCategoryRenameSchema, fatwaCategoryReorderSchema } from "@/lib/validators/admin-fatwa";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/fatwa-categories — rename one category or rebuild the
 * category order (ADMIN, FATWA, EDITOR). Body is either
 * { id, nameBn, nameEn } (rename) or { order: [{ id, sortOrder }] } (reorder).
 */
export async function PATCH(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "fatwa");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const rename = fatwaCategoryRenameSchema.safeParse(body);
  if (rename.success) {
    const existing = await db.fatwaCategory.findUnique({ where: { id: rename.data.id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "ক্যাটাগরিটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }
    const category = await db.fatwaCategory.update({
      where: { id: rename.data.id },
      data: { nameBn: rename.data.nameBn, nameEn: rename.data.nameEn },
    });
    await audit(
      guard.session.user.id,
      "fatwaCategory.rename",
      "FatwaCategory",
      category.id,
      { before: { key: existing.key, nameBn: existing.nameBn }, after: { key: category.key, nameBn: category.nameBn, nameEn: category.nameEn } },
      request.headers.get("x-real-ip"),
    );
    return NextResponse.json({ ok: true, data: { id: category.id } });
  }

  const reorder = fatwaCategoryReorderSchema.safeParse(body);
  if (reorder.success) {
    const ids = reorder.data.order.map((item) => item.id);
    const found = await db.fatwaCategory.findMany({ where: { id: { in: ids } }, select: { id: true } });
    if (found.length !== ids.length) {
      return NextResponse.json({ ok: false, error: "ক্রম তালিকায় অজানা ক্যাটাগরি আছে।" }, { status: 400 });
    }
    await db.$transaction(reorder.data.order.map((item) => db.fatwaCategory.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })));
    await audit(
      guard.session.user.id,
      "fatwaCategory.reorder",
      "FatwaCategory",
      null,
      { after: { order: ids.join(",") } },
      request.headers.get("x-real-ip"),
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { ok: false, error: "ক্যাটাগরির নাম বদলানোর তথ্য যাচাই করুন।", fields: { body: "বৈধ রিনেম বা রিঅর্ডার পেলোড দিন" } },
    { status: 400 },
  );
}
