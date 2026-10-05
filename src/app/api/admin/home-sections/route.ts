import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { homeSectionsPatchSchema } from "@/lib/validators/admin-settings";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/home-sections — batch-update the home page composition:
 * enable/disable sections, reorder them, edit their titles. The public home
 * page reads the enabled keys in sortOrder, so this IS the home page editor.
 */
export async function PATCH(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = homeSectionsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "সেকশনের তথ্যগুলো যাচাই করুন।" }, { status: 400 });
  }

  for (const update of parsed.data.updates) {
    const { key, ...fields } = update;
    const before = await db.homeSection.findUnique({ where: { key } });
    if (!before) continue; // unknown keys are ignored (sections are fixed set)
    await db.homeSection.update({
      where: { key },
      data: {
        ...(fields.isEnabled !== undefined ? { isEnabled: fields.isEnabled } : {}),
        ...(fields.sortOrder !== undefined ? { sortOrder: fields.sortOrder } : {}),
        ...(fields.titleBn !== undefined ? { titleBn: fields.titleBn } : {}),
        ...(fields.titleEn !== undefined ? { titleEn: fields.titleEn } : {}),
      },
    });
    await audit(
      guard.session.user.id,
      "home-section.update",
      "HomeSection",
      key,
      { before, after: { ...before, ...fields } },
      request.headers.get("x-real-ip"),
    );
  }

  return NextResponse.json({ ok: true, data: { updated: parsed.data.updates.length } });
}
