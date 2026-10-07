import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { isPreviewEntity, PREVIEW_TTL_MS, signPreviewToken } from "@/lib/preview-link";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/preview-link { entity, entityId } → { url, expiresAt }.
 * Mints a 24-hour HMAC-signed preview link for a Notice or Post (drafts
 * included). Only content.manage staff; the row must exist.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const { entity, entityId } = (body ?? {}) as { entity?: unknown; entityId?: unknown };
  if (!isPreviewEntity(entity) || typeof entityId !== "string" || !entityId) {
    return NextResponse.json(
      { ok: false, error: "entity অবশ্যই Notice বা Post হতে হবে এবং entityId প্রয়োজন।", fields: { entity: "তালিকাভুক্ত নয়" } },
      { status: 400 },
    );
  }

  // The row must exist — a link to nothing is always a mistake (and the
  // entity check above keeps every other table out of preview reach).
  const row =
    entity === "Notice"
      ? await db.notice.findUnique({ where: { id: entityId }, select: { id: true } })
      : await db.post.findUnique({ where: { id: entityId }, select: { id: true } });
  if (!row) {
    return NextResponse.json({ ok: false, error: "কনটেন্টটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  const token = signPreviewToken(entity, entityId);
  return NextResponse.json({
    ok: true,
    data: {
      url: `/preview/${token}`,
      expiresAt: new Date(Date.now() + PREVIEW_TTL_MS).toISOString(),
    },
  });
}
