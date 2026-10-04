import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { noticeSchema, zodFields } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit";
import { slugifyTitle } from "@/lib/slug";

export const dynamic = "force-dynamic";

/** Guarantee slug uniqueness by appending -2, -3… (timestamp fallback after 25 tries). */
async function buildUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  for (let attempt = 2; attempt <= 25; attempt++) {
    const existing = await db.notice.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${base}-${attempt}`;
  }
  return `${base}-${Date.now()}`;
}

/** POST /api/admin/notices — publish a new notice (admin-only). */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const parsed = noticeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  const { titleBn, titleEn, excerptBn, excerptEn, bodyBn, bodyEn, category, status, attachmentUrl, slug } = parsed.data;

  const base = slug || slugifyTitle(titleEn) || `notice-${Date.now()}`;

  try {
    const finalSlug = await buildUniqueSlug(base);
    const notice = await db.notice.create({
      data: {
        slug: finalSlug,
        titleBn,
        titleEn,
        excerptBn,
        excerptEn,
        bodyBn: bodyBn || "",
        bodyEn: bodyEn || "",
        category,
        status: status ?? "active",
        attachmentUrl: attachmentUrl || null,
        publishedAt: new Date(),
      },
      select: { id: true, slug: true, titleBn: true },
    });

    await logAdminAction({
      actor: session,
      action: "notice.create",
      entityRef: notice.slug,
      summaryBn: `নতুন নোটিশ প্রকাশ: “${notice.titleBn}”`,
    });

    return jsonOk({ id: notice.id, slug: notice.slug, message: "নোটিশ সফলভাবে প্রকাশিত হয়েছে" }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("এই স্লাগ ইতিমধ্যে ব্যবহৃত — অন্য স্লাগ দিন", "VALIDATION", 409);
    }
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
