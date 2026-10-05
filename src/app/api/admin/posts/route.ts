import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { postCreateSchema, sanitizePostPayload } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

/** Reading-time estimate: Bangla body words / 200 (min 1). */
function estimateReadingMinutes(bodyBn: string): number {
  const words = bodyBn.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** POST /api/admin/posts — create a post (ADMIN, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = postCreateSchema.safeParse(body);
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
  const slug = data.slug || slugify(data.titleEn || data.titleBn);
  if (await db.post.findUnique({ where: { slug } })) {
    return NextResponse.json({ ok: false, error: "এই স্লাগ ইতিমধ্যেই ব্যবহৃত — অন্য একটি দিন।", fields: { slug: "স্লাগ ডুপ্লিকেট" } }, { status: 409 });
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

  let publishedAt: Date | null = null;
  if (data.isPublished) {
    publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();
    if (Number.isNaN(publishedAt.getTime())) publishedAt = new Date();
  }

  const { categoryId, authorId, coverMediaId, ...rest } = data;
  const post = await db.post.create({
    data: {
      ...rest,
      slug,
      publishedAt,
      readingMinutes: estimateReadingMinutes(data.bodyBn),
      ...(categoryId !== undefined ? { categoryId: categoryId ?? null } : {}),
      ...(authorId !== undefined ? { authorId: authorId ?? null } : {}),
      ...(coverMediaId !== undefined ? { coverMediaId: coverMediaId ?? null } : {}),
    },
  });

  await audit(
    guard.session.user.id,
    "post.create",
    "Post",
    post.id,
    { after: { titleBn: post.titleBn, kind: post.kind, isPublished: post.isPublished, categoryId: post.categoryId } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: post.slug, id: post.id } }, { status: 201 });
}
