import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { fatwaPublishSchema, zodFields } from "@/lib/validators";
import { buildUniqueFatwaSlug, slugifyTitle } from "@/lib/slug";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/fatwa-questions/[id]/publish — promote an answered question
 * into the public fatwa bank. Creates a bilingual FatwaEntry, or updates the
 * existing entry when the question is re-published after an answer edit.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return jsonError("অনুমতি নেই", "UNAUTHORIZED", 403);

  if (!isSameOrigin(request)) return jsonError("Invalid origin", "UNAUTHORIZED", 403);

  const limiter = rateLimit({ key: "admin-write", identifier: getClientIp(request), limit: 30, windowMs: 60_000 });
  if (!limiter.ok) return jsonError("Too many requests", "RATE_LIMIT", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", "VALIDATION", 400);
  }

  const parsed = fatwaPublishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  const { questionBn, questionEn, answerBn, answerEn, answeredBy, slug } = parsed.data;
  const { id } = await params;

  try {
    const existing = await db.fatwaQuestion.findUnique({
      where: { id },
      select: { id: true, status: true, isPrivate: true, publishedSlug: true, answer: true, category: true },
    });
    if (!existing) return jsonError("প্রশ্নটি পাওয়া যায়নি", "NOT_FOUND", 404);
    if (existing.isPrivate) {
      return jsonError("প্রাইভেট প্রশ্ন প্রকাশ্য ব্যাংকে প্রকাশ করা যাবে না", "FORBIDDEN", 403);
    }
    if (!existing.answer || (existing.status !== "answered" && existing.status !== "published")) {
      return jsonError("প্রকাশের আগে প্রশ্নের উত্তর লিখুন (উত্তরপ্রাপ্ত অবস্থায় থাকতে হবে)", "PRECONDITION", 400);
    }

    // Re-publish path: refresh the existing entry in place (answer edits).
    const republishedSlug = existing.status === "published" ? existing.publishedSlug : null;
    if (republishedSlug) {
      const current = await db.fatwaEntry.findUnique({
        where: { slug: republishedSlug },
        select: { id: true, slug: true, publishedAt: true },
      });
      if (current) {
        const entry = await db.fatwaEntry.update({
          where: { id: current.id },
          data: {
            questionBn,
            questionEn,
            answerBn,
            answerEn,
            answeredBy,
            category: existing.category,
          },
          select: { id: true, slug: true },
        });
        await logAdminAction({
          actor: session,
          action: "fatwa.publish",
          entityRef: entry.slug,
          summaryBn: `ফতোয়া ব্যাংক এন্ট্রি হালনাগাদ: “${questionBn.slice(0, 80)}…”`,
        });
        return jsonOk({ entryId: entry.id, slug: entry.slug, message: "ব্যাংক এন্ট্রি হালনাগাদ করা হয়েছে" });
      }
    }

    const base = slug || slugifyTitle(questionEn) || `fatwa-${Date.now()}`;
    const finalSlug = await buildUniqueFatwaSlug(base);

    const entry = await db.fatwaEntry.create({
      data: {
        slug: finalSlug,
        category: existing.category,
        questionBn,
        questionEn,
        answerBn,
        answerEn,
        answeredBy,
        publishedAt: new Date(),
      },
      select: { id: true, slug: true },
    });

    await db.fatwaQuestion.update({
      where: { id },
      data: { status: "published", publishedSlug: finalSlug },
      select: { id: true },
    });

    await logAdminAction({
      actor: session,
      action: "fatwa.publish",
      entityRef: finalSlug,
      summaryBn: `ফতোয়া ব্যাংকে প্রকাশ: “${questionBn.slice(0, 80)}…”`,
    });

    return jsonOk(
      { entryId: entry.id, slug: entry.slug, message: "ফতোয়াটি ব্যাংকে প্রকাশিত হয়েছে" },
      201,
    );
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
