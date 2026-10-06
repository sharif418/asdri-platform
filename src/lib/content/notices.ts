import type { NoticeCategory as DbNoticeCategory, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/settings";
import { NOTICE_CATEGORIES, type NoticeCategory, type NoticeStatus } from "@/types";

/** Shared published-notice query: homepage feed (server component) + /api/notices. */

export interface NoticeFeedItem {
  id: string;
  slug: string;
  title: { bn: string; en: string };
  excerpt: { bn: string; en: string };
  category: NoticeCategory;
  status: NoticeStatus;
  pinned: boolean;
  publishedAt: string;
  attachmentUrl: string | null;
}

export interface NoticeFeedResult {
  items: NoticeFeedItem[];
  total: number;
  page: number;
  pageSize: number;
}

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

export interface NoticeFeedQuery {
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Published notices, pinned first then newest. Status is not filtered — a
 * CLOSED notice stays on the board as history; the `status` field lets
 * clients render the badge. When the notices feature flag is switched off
 * the feed is empty (matching the page and API).
 */
export async function listNotices({
  category = "all",
  q = "",
  page = 1,
  pageSize = 12,
}: NoticeFeedQuery): Promise<NoticeFeedResult> {
  if (!(await isFeatureEnabled("notices"))) {
    return { items: [], total: 0, page: 1, pageSize };
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

  const items: NoticeFeedItem[] = rows.map((row) => ({
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

  return { items, total, page, pageSize };
}
