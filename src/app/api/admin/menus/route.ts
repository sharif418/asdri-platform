import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { invalidateSiteMenus } from "@/lib/content/menus";
import { menuCreateSchema } from "@/lib/validators/admin-settings";

export const dynamic = "force-dynamic";

/** POST /api/admin/menus — add a menu item (parent optional for HEADER_MAIN). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "menus");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = menuCreateSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join(".") || "_", i.message]));
    return NextResponse.json({ ok: false, error: "মেনু আইটেমের তথ্যগুলো যাচাই করুন।", fields }, { status: 400 });
  }

  // A child must belong to an existing HEADER_MAIN parent, and nesting is
  // capped at one level (the header renders a two-level tree).
  if (parsed.data.parentId) {
    const parent = await db.menuItem.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent || parent.parentId) {
      return NextResponse.json(
        { ok: false, error: "প্যারেন্ট মেনুটি পাওয়া যায়নি বা এর নিজেই চাইল্ড — দুই স্তরের বেশি অনুমোদিত নয়।" },
        { status: 400 },
      );
    }
  }

  const row = await db.menuItem.create({ data: parsed.data });
  invalidateSiteMenus();
  await audit(
    guard.session.user.id,
    "menu.create",
    "MenuItem",
    row.id,
    { after: parsed.data },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true, data: { id: row.id } }, { status: 201 });
}
