import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { noticeUpdateSchema, sanitizeNoticePayload } from "@/lib/validators/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/notices/[id] — update a notice (ADMIN, EDITOR). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.notice.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "নোটিশটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = noticeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "ফর্মের তথ্য যাচাই করুন।", fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])) },
      { status: 400 },
    );
  }

  const data = sanitizeNoticePayload(parsed.data);
  const { publishedAt, attachmentMediaId, ...rest } = data;

  const notice = await db.notice.update({
    where: { id },
    data: {
      ...rest,
      ...(publishedAt !== undefined ? { publishedAt: new Date(publishedAt) } : {}),
      ...(attachmentMediaId !== undefined ? { attachmentMediaId: attachmentMediaId ?? null } : {}),
    },
  });

  await audit(guard.session.user.id, "notice.update", "Notice", notice.id, {
    before: { titleBn: existing.titleBn, status: existing.status, pinned: existing.pinned },
    after: { titleBn: notice.titleBn, status: notice.status, pinned: notice.pinned },
  }, request.headers.get("x-real-ip"));

  return NextResponse.json({ ok: true, data: { slug: notice.slug } });
}

/** DELETE /api/admin/notices/[id] — remove a notice (ADMIN, EDITOR). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.notice.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "নোটিশটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.notice.delete({ where: { id } });
  await audit(guard.session.user.id, "notice.delete", "Notice", id, { before: { titleBn: existing.titleBn } }, request.headers.get("x-real-ip"));

  return NextResponse.json({ ok: true });
}
