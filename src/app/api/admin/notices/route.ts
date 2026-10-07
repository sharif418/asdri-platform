import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { buildUniqueSlug, slugify } from "@/lib/slug";
import { noticeCreateSchema, sanitizeNoticePayload } from "@/lib/validators/admin";

export const dynamic = "force-dynamic";

/** POST /api/admin/notices — create a notice (ADMIN, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = noticeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "ফর্মের তথ্য যাচাই করুন।", fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])) },
      { status: 400 },
    );
  }

  const data = sanitizeNoticePayload(parsed.data);
  // Client slug wins when unique; otherwise (none sent / collision, e.g. a
  // Bangla-only title that slugifies to "") a unique slug is generated.
  const base = data.slug || slugify(data.titleEn || data.titleBn);
  const slug = await buildUniqueSlug(base, async (candidate) => {
    const existing = await db.notice.findUnique({ where: { slug: candidate }, select: { id: true } });
    return !!existing;
  });

  const notice = await db.notice.create({
    data: {
      slug,
      titleBn: data.titleBn,
      titleEn: data.titleEn,
      excerptBn: data.excerptBn,
      excerptEn: data.excerptEn,
      bodyBn: data.bodyBn,
      bodyEn: data.bodyEn,
      category: data.category,
      status: data.status,
      pinned: data.pinned,
      isPublished: data.isPublished,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
      attachmentMediaId: data.attachmentMediaId ?? null,
    },
  });

  await audit(guard.session.user.id, "notice.create", "Notice", notice.id, { after: { titleBn: notice.titleBn, category: notice.category, status: notice.status } }, request.headers.get("x-real-ip"));

  return NextResponse.json({ ok: true, data: { slug: notice.slug, id: notice.id } }, { status: 201 });
}
