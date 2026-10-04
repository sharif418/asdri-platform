import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sanitizeRichText } from "@/lib/sanitize";
import { buildUniqueFatwaSlug, slugifyTitle } from "@/lib/slug";
import { fatwaQuestionPublishSchema } from "@/lib/validators/admin-fatwa";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/fatwa-questions/[id]/publish — promote an answered
 * question into the public fatwa bank (ADMIN, FATWA, EDITOR). Creates the
 * FatwaEntry on first publish and keeps it in sync afterwards. Private
 * questions can never be published — their answer goes out by email only.
 */
export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "fatwa");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.fatwaQuestion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "জিজ্ঞাসাটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }
  if (existing.isPrivate) {
    return NextResponse.json(
      { ok: false, error: "এই জিজ্ঞাসাটি গোপনীয় — প্রশ্নকর্তা শুধু ইমেইলে উত্তর পাবেন, ফতোয়া ব্যাংকে প্রকাশ করা যাবে না।" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const parsed = fatwaQuestionPublishSchema.safeParse(body ?? {});
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

  const data = parsed.data;
  const answer = sanitizeRichText(data.answer ?? existing.answer ?? "");
  if (answer.trim().length === 0) {
    return NextResponse.json(
      { ok: false, error: "প্রকাশের আগে প্রশ্নের উত্তর লিখুন ও সংরক্ষণ করুন।", fields: { answer: "উত্তর খালি" } },
      { status: 400 },
    );
  }

  if (data.categoryId != null) {
    const category = await db.fatwaCategory.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) {
      return NextResponse.json({ ok: false, error: "নির্বাচিত ক্যাটাগরিটি খুঁজে পাওয়া যায়নি।", fields: { categoryId: "ক্যাটাগরি নেই" } }, { status: 400 });
    }
  }

  const entry = await db.$transaction(async (tx) => {
    const categoryId = data.categoryId !== undefined ? data.categoryId : (await tx.fatwaCategory.findUnique({ where: { key: existing.categoryKey }, select: { id: true } }))?.id ?? null;

    if (existing.publishedSlug) {
      return tx.fatwaEntry.update({
        where: { slug: existing.publishedSlug },
        data: {
          questionBn: existing.question,
          questionEn: data.questionEn,
          answerBn: answer,
          answeredBy: data.answeredBy,
          ...(categoryId !== undefined ? { categoryId: categoryId ?? null } : {}),
          isPublished: data.isPublished,
        },
      });
    }

    const base = slugifyTitle(data.questionEn) || `fatwa-${existing.reference.toLowerCase()}`;
    const slug = await buildUniqueFatwaSlug(base);
    return tx.fatwaEntry.create({
      data: {
        slug,
        questionBn: existing.question,
        questionEn: data.questionEn,
        answerBn: answer,
        answeredBy: data.answeredBy,
        categoryId: categoryId ?? null,
        isPublished: data.isPublished,
      },
    });
  });

  const question = await db.fatwaQuestion.update({
    where: { id },
    data: {
      answer,
      status: "PUBLISHED",
      publishedSlug: entry.slug,
      answeredById: existing.answeredById ?? guard.session.user.id,
      answeredAt: existing.answeredAt ?? new Date(),
    },
  });

  await Promise.all([
    audit(
      guard.session.user.id,
      "fatwaQuestion.publish",
      "FatwaQuestion",
      question.id,
      { before: { reference: existing.reference, status: existing.status }, after: { reference: question.reference, status: question.status, slug: entry.slug } },
      request.headers.get("x-real-ip"),
    ),
    audit(
      guard.session.user.id,
      existing.publishedSlug ? "fatwaEntry.update" : "fatwaEntry.create",
      "FatwaEntry",
      entry.id,
      { after: { slug: entry.slug, answeredBy: entry.answeredBy, isPublished: entry.isPublished } },
      request.headers.get("x-real-ip"),
    ),
  ]);

  return NextResponse.json({ ok: true, data: { slug: entry.slug, reference: question.reference } }, { status: 201 });
}
