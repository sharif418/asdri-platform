import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { invalidateSettings } from "@/lib/settings";
import { flagsPatchSchema } from "@/lib/validators/admin-settings";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/flags — toggle feature flags. Flags remove a module from
 * the sitemap, search, public navigation AND the public APIs; the admin
 * sidebar hides the module's desk too.
 */
export async function PATCH(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "flags");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = flagsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "ফ্ল্যাগের তথ্যগুলো যাচাই করুন।" }, { status: 400 });
  }

  for (const update of parsed.data.updates) {
    const existing = await db.featureFlag.findUnique({ where: { key: update.key } });
    if (!existing) continue; // unknown keys ignored
    await db.featureFlag.update({ where: { key: update.key }, data: { isEnabled: update.isEnabled } });
    await audit(
      guard.session.user.id,
      "flag.update",
      "FeatureFlag",
      update.key,
      { before: existing, after: { isEnabled: update.isEnabled } },
      request.headers.get("x-real-ip"),
    );
  }

  invalidateSettings(); // clears the flag cache too
  return NextResponse.json({ ok: true, data: { updated: parsed.data.updates.length } });
}
