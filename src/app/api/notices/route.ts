import { NextRequest, NextResponse } from "next/server";
import type { NoticeCategory as DbNoticeCategory, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getClientIp, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { isFeatureEnabled } from "@/lib/settings";
import { NOTICE_CATEGORIES, type NoticeCategory, type NoticeStatus } from "@/types";

export const dynamic = "force-dynamic";

/** Consumers: homepage notices feed, ⌘K palette live search. 30s shared cache. */
const CACHE_CONTROL = "public, max-age=0, s-maxage=30, stale-while-revalidate=60";
const CATEGORY_VALUES: readonly string[] = ["all", ...NOTICE_CATEGORIES];

const NOTICE_SELECT = {
  id: true,
  slug: true,
  titleBn: true,
  titleEn: true,
  excerptBn: true,
  excerptEn: true,
  category: true,
  status: true,
  pinned: true,
  publishedAt: true,
  attachment: { select: { key: true } },
} as const;

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** GET /api/notices?category=&q=&page=&pageSize= — published notice feed.
 *
 * Pinned notices lead (site-wide editorial curation), then newest first.
 * Status is not filtered — a CLOSED notice stays on the board as history;
 * the `status` field lets clients render the badge.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Feature flag: a switched-off module serves an empty feed, matching the page.
  if (!(await isFeatureEnabled("notices"))) {
    return jsonOk({ items: [], total: 0, page: 1, pageSize: 10 });
  }

  const limiter = rateLimit({
    key: "notices-read",
    identifier: getClientIp(request),
    limit: 60,
    windowMs: 60_000,
  });
  if (!limiter.ok) {
    return jsonError("অনেকবার অনুরোধ পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  const params = request.nextUrl.searchParams;
  const category = (params.get("category") ?? "").trim().toLowerCase();
  const q = (params.get("q") ?? "").trim().slice(0, 120);
  const page = Math.max(1, parsePositiveInt(params.get("page"), 1));
  const pageSize = Math.min(50, Math.max(1, parsePositiveInt(params.get("pageSize"), 12)));

  if (category && !CATEGORY_VALUES.includes(category)) {
    return jsonError("অজানা ক্যাটাগরি", "VALIDATION", 400, {
      category: "ক্যাটাগরি all, admission, academic, recruitment বা general হতে হবে",
    });
  }

  const where: Prisma.NoticeWhereInput = {
    isPublished: true,
    publishedAt: { lte: new Date() },
    ...(category && category !== "all" ? { category: category.toUpperCase() as DbNoticeCategory } : {}),
    ...(q
      ? {
          OR: [
            { titleBn: { contains: q, mode: "insensitive" } },
            { titleEn: { contains: q, mode: "insensitive" } },
            { excerptBn: { contains: q, mode: "insensitive" } },
            { excerptEn: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  try {
    const [total, rows] = await Promise.all([
      db.notice.count({ where }),
      db.notice.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: NOTICE_SELECT,
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: { bn: row.titleBn, en: row.titleEn },
      excerpt: { bn: row.excerptBn, en: row.excerptEn },
      category: (NOTICE_CATEGORIES.includes(row.category.toLowerCase() as NoticeCategory)
        ? row.category.toLowerCase()
        : "general") as NoticeCategory,
      status: (["new", "active", "closed"].includes(row.status.toLowerCase())
        ? row.status.toLowerCase()
        : "closed") as NoticeStatus,
      pinned: row.pinned,
      attachmentUrl: row.attachment ? `/api/media/${row.attachment.key}` : null,
      publishedAt: row.publishedAt.toISOString(),
    }));

    const response = jsonOk({ items, total, page, pageSize });
    response.headers.set("Cache-Control", CACHE_CONTROL);
    return response;
  } catch {
    return jsonError("নোটিশ লোড করা যায়নি", "SERVER", 500);
  }
}
