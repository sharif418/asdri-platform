import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { noticeUpdateSchema, zodFields } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/notices/[id] — update an existing notice (admin-only). */
export async function PATCH(
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

  const parsed = noticeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    const existing = await db.notice.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!existing) return jsonError("নোটিশটি পাওয়া যায়নি", "NOT_FOUND", 404);

    const { titleBn, titleEn, excerptBn, excerptEn, bodyBn, bodyEn, category, status, attachmentUrl, slug, publishedAt } =
      parsed.data;

    // Slug semantics: empty string keeps the current slug; a new value must stay unique.
    let nextSlug: string;
    if (slug && slug !== existing.slug) {
      const clash = await db.notice.findFirst({ where: { slug, NOT: { id } }, select: { id: true } });
      if (clash) {
        return jsonError("এই স্লাগ ইতিমধ্যে অন্য নোটিশে ব্যবহৃত — অন্য স্লাগ দিন", "VALIDATION", 409);
      }
      nextSlug = slug;
    } else {
      nextSlug = existing.slug;
    }

    const data: Prisma.NoticeUpdateInput = {
      titleBn,
      titleEn,
      excerptBn,
      excerptEn,
      bodyBn: bodyBn || "",
      bodyEn: bodyEn || "",
      category,
      status: status ?? "active",
      attachmentUrl: attachmentUrl || null,
      slug: nextSlug,
      ...(publishedAt ? { publishedAt: new Date(publishedAt) } : {}),
    };

    const updated = await db.notice.update({ where: { id }, data, select: { id: true, slug: true, titleBn: true } });

    await logAdminAction({
      actor: session,
      action: "notice.update",
      entityRef: updated.slug,
      summaryBn: `নোটিশ সম্পাদনা: “${updated.titleBn}”`,
    });

    return jsonOk({ id: updated.id, slug: updated.slug, message: "নোটিশ সফলভাবে হালনাগাদ হয়েছে" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("এই স্লাগ ইতিমধ্যে ব্যবহৃত — অন্য স্লাগ দিন", "VALIDATION", 409);
    }
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}

/** DELETE /api/admin/notices/[id] — remove a notice (admin-only). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return jsonError("অনুমতি নেই", "UNAUTHORIZED", 403);

  if (!isSameOrigin(request)) return jsonError("Invalid origin", "UNAUTHORIZED", 403);

  const limiter = rateLimit({ key: "admin-write", identifier: getClientIp(request), limit: 30, windowMs: 60_000 });
  if (!limiter.ok) return jsonError("Too many requests", "RATE_LIMIT", 429);

  const { id } = await params;

  try {
    const existing = await db.notice.findUnique({ where: { id }, select: { id: true, titleBn: true, slug: true } });
    if (!existing) return jsonError("নোটিশটি পাওয়া যায়নি", "NOT_FOUND", 404);

    await db.notice.delete({ where: { id } });

    await logAdminAction({
      actor: session,
      action: "notice.delete",
      entityRef: existing.slug,
      summaryBn: `নোটিশ মুছে ফেলা হয়েছে: “${existing.titleBn}”`,
    });

    return jsonOk({ message: "নোটিশ মুছে ফেলা হয়েছে" });
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
