import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { invalidateSettings } from "@/lib/settings";
import { invalidateSiteConfig } from "@/lib/content/site";
import { invalidateSiteMenus } from "@/lib/content/menus";
import { SETTING_SCHEMAS } from "@/lib/validators/admin-settings";

export const dynamic = "force-dynamic";

function fieldsOf(error: { issues: { path: (string | number | symbol)[]; message: string }[] }): Record<string, string> {
  return Object.fromEntries(error.issues.map((i) => [i.path.join(".") || "_", i.message]));
}

/**
 * PATCH /api/admin/settings — write one typed settings blob.
 * Body: { key, value } where key must be in SETTING_SCHEMAS (the whitelist of
 * office-editable keys). Every write is audited with before/after and busts
 * the settings + site-config caches so the public site reflects it on the
 * next render.
 */
export async function PATCH(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "settings");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsedKey = (body as { key?: unknown }).key;
  if (typeof parsedKey !== "string" || !(parsedKey in SETTING_SCHEMAS)) {
    return NextResponse.json({ ok: false, error: "এই সেটিংটি সম্পাদনাযোগ্য নয়।" }, { status: 400 });
  }
  const key = parsedKey;

  const schema = SETTING_SCHEMAS[key];
  const parsed = schema.safeParse((body as { value?: unknown }).value);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "সেটিংসের তথ্যগুলো যাচাই করুন।", fields: fieldsOf(parsed.error) },
      { status: 400 },
    );
  }

  const before = await db.siteSetting.findUnique({ where: { key } });
  const row = await db.siteSetting.upsert({
    where: { key },
    create: { key, value: parsed.data as never, updatedBy: guard.session.user.id },
    update: { value: parsed.data as never, updatedBy: guard.session.user.id },
  });

  await audit(
    guard.session.user.id,
    "setting.update",
    "SiteSetting",
    key,
    { before: before?.value ?? null, after: parsed.data },
    request.headers.get("x-real-ip"),
  );

  // Cache bust: settings readers, the merged site-config view, and menus all
  // re-read on the next request.
  invalidateSettings();
  invalidateSiteConfig();
  invalidateSiteMenus();

  return NextResponse.json({ ok: true, data: { key, updatedAt: row.updatedAt } });
}
