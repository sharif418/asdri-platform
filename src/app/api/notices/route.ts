import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { NOTICE_CATEGORIES } from "@/types";
import type { NoticeCategory } from "@/types";

export const dynamic = "force-dynamic";

/** GET /api/notices?category=&q=&page=&pageSize= — paginated notice board feed. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const limiter = rateLimit({
    key: "notices-read",
    identifier: getClientIp(request),
    limit: 60,
    windowMs: 60_000,
  });
  if (!limiter.ok) {
    return jsonError("Too many requests", "RATE_LIMIT", 429);
  }

  const params = request.nextUrl.searchParams;
  const category = params.get("category");
  const q = params.get("q")?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(params.get("pageSize") ?? "12", 10) || 12));

  if (category && !NOTICE_CATEGORIES.includes(category as NoticeCategory)) {
    return jsonError("Invalid category", "VALIDATION", 400);
  }

  try {
    const where = {
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { titleBn: { contains: q } },
              { titleEn: { contains: q } },
              { excerptBn: { contains: q } },
              { excerptEn: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      db.notice.count({ where }),
      db.notice.findMany({
        where,
        // Editorial curation: pinned notices first, then newest.
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          titleBn: true,
          titleEn: true,
          excerptBn: true,
          excerptEn: true,
          category: true,
          status: true,
          pinned: true,
          attachmentUrl: true,
          publishedAt: true,
        },
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: { bn: row.titleBn, en: row.titleEn },
      excerpt: { bn: row.excerptBn, en: row.excerptEn },
      category: row.category as NoticeCategory,
      status: row.status as "new" | "active" | "closed",
      pinned: row.pinned,
      attachmentUrl: row.attachmentUrl,
      publishedAt: row.publishedAt.toISOString(),
    }));

    return jsonOk({ items, total, page, pageSize });
  } catch {
    return jsonError("Failed to load notices", "SERVER", 500);
  }
}
