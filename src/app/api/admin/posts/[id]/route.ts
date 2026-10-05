import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { postUpdateSchema, sanitizePostPayload } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Reading-time estimate: Bangla body words / 200 (min 1). */
function estimateReadingMinutes(bodyBn: string): number {
  const words = bodyBn.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** PATCH /api/admin/posts/[id] — update a post (ADMIN, EDITOR). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.post.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "পোস্টটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = postUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "ফর্মের তথ্য যাচাই করুন।",
        fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])),
      },
      { status: 400 },
    );
  }

  const data = sanitizePostPayload(parsed.data);
  if (data.slug !== undefined && data.slug !== existing.slug && (await db.post.findUnique({ where: { slug: data.slug } }))) {
    return NextResponse.json({ ok: false, error: "এই স্লাগ ইতিমধ্যেই ব্যবহৃত।", fields: { slug: "স্লাগ ডুপ্লিকেট" } }, { status: 409 });
  }
  if (data.categoryId && !(await db.postCategory.findUnique({ where: { id: data.categoryId } }))) {
    return NextResponse.json({ ok: false, error: "নির্বাচিত ক্যাটাগরিটি খুঁজে পাওয়া যায়নি।", fields: { categoryId: "ক্যাটাগরি নেই" } }, { status: 400 });
  }
  if (data.authorId && !(await db.person.findUnique({ where: { id: data.authorId } }))) {
    return NextResponse.json({ ok: false, error: "নির্বাচিত লেখক খুঁজে পাওয়া যায়নি।", fields: { authorId: "লেখক নেই" } }, { status: 400 });
  }
  if (data.coverMediaId && !(await db.media.findUnique({ where: { id: data.coverMediaId } }))) {
    return NextResponse.json({ ok: false, error: "নির্বাচিত কভার ছবি খুঁজে পাওয়া যায়নি।", fields: { coverMediaId: "মিডিয়া নেই" } }, { status: 400 });
  }

  const { categoryId, authorId, coverMediaId, publishedAt, ...rest } = data;

  // publishedAt handling: explicit value wins; first publish stamps now.
  let nextPublishedAt: Date | null | undefined;
  if (publishedAt !== undefined) {
    const parsedDate = new Date(publishedAt);
    nextPublishedAt = Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  } else if (rest.isPublished === true && existing.publishedAt === null) {
    nextPublishedAt = new Date();
  } else if (rest.isPublished === false) {
    nextPublishedAt = existing.publishedAt; // keep the original stamp on unpublish
  }

  const post = await db.post.update({
    where: { id },
    data: {
      ...rest,
      ...(nextPublishedAt !== undefined ? { publishedAt: nextPublishedAt } : {}),
      ...(data.bodyBn !== undefined ? { readingMinutes: estimateReadingMinutes(data.bodyBn) } : {}),
      ...(categoryId !== undefined ? { categoryId: categoryId ?? null } : {}),
      ...(authorId !== undefined ? { authorId: authorId ?? null } : {}),
      ...(coverMediaId !== undefined ? { coverMediaId: coverMediaId ?? null } : {}),
    },
  });

  await audit(
    guard.session.user.id,
    "post.update",
    "Post",
    post.id,
    {
      before: { titleBn: existing.titleBn, isPublished: existing.isPublished, categoryId: existing.categoryId },
      after: { titleBn: post.titleBn, isPublished: post.isPublished, categoryId: post.categoryId },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: post.slug } });
}

/** DELETE /api/admin/posts/[id] — remove a post (ADMIN, EDITOR). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.post.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "পোস্টটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.post.delete({ where: { id } });
  await audit(guard.session.user.id, "post.delete", "Post", id, { before: { titleBn: existing.titleBn, slug: existing.slug } }, request.headers.get("x-real-ip"));

  return NextResponse.json({ ok: true });
}
