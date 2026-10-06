import type { NoticeCategory as DbNoticeCategory, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/settings";
import { NOTICE_CATEGORIES, type NoticeCategory, type NoticeStatus } from "@/types";

/** Shared published-notice queries: homepage feed, /api/notices, /notices/[slug]. */

/** Full notice detail (rich bodies included) for the public detail page. */
export interface NoticeDetailRecord {
  slug: string;
  title: { bn: string; en: string };
  excerpt: { bn: string; en: string };
  body: { bn: string; en: string };
  category: NoticeCategory;
  status: NoticeStatus;
  pinned: boolean;
  attachmentUrl: string | null;
  publishedAt: string;
  updatedAt: string;
}

export async function getNoticeBySlug(slug: string): Promise<NoticeDetailRecord | null> {
  if (!(await isFeatureEnabled("notices"))) return null;
  const row = await db.notice.findUnique({
    where: { slug },
    select: {
      slug: true,
      titleBn: true,
      titleEn: true,
      excerptBn: true,
      excerptEn: true,
      bodyBn: true,
      bodyEn: true,
      category: true,
      status: true,
      pinned: true,
      publishedAt: true,
      updatedAt: true,
      isPublished: true,
      attachment: { select: { key: true } },
    },
  });
  // Unpublished/missing notices are indistinguishable to the public (404).
  if (!row || !row.isPublished || row.publishedAt > new Date()) return null;
  return {
    slug: row.slug,
    title: { bn: row.titleBn, en: row.titleEn },
    excerpt: { bn: row.excerptBn, en: row.excerptEn },
    body: { bn: row.bodyBn, en: row.bodyEn },
    category: (NOTICE_CATEGORIES.includes(row.category.toLowerCase() as NoticeCategory)
      ? row.category.toLowerCase()
      : "general") as NoticeCategory,
    status: (["new", "active", "closed"].includes(row.status.toLowerCase())
      ? row.status.toLowerCase()
      : "closed") as NoticeStatus,
    pinned: row.pinned,
    attachmentUrl: row.attachment ? `/api/media/${row.attachment.key}` : null,
    publishedAt: row.publishedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Chronological neighbours of a published notice for prev/next navigation:
 * `prev` is the next OLDER notice, `next` the next NEWER one (published only,
 * future-dated excluded — the board never shows them either).
 */
export async function getNoticeNeighbors(
  publishedAt: string,
): Promise<{ prev: { slug: string; title: { bn: string; en: string } } | null; next: { slug: string; title: { bn: string; en: string } } | null }> {
  if (!(await isFeatureEnabled("notices"))) return { prev: null, next: null };
  const at = new Date(publishedAt);
  const neighborSelect = { slug: true, titleBn: true, titleEn: true } as const;
  const [older, newer] = await Promise.all([
    db.notice.findFirst({
      where: { isPublished: true, publishedAt: { lt: at, lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      select: neighborSelect,
    }),
    db.notice.findFirst({
      where: { isPublished: true, publishedAt: { gt: at, lte: new Date() } },
      orderBy: { publishedAt: "asc" },
      select: neighborSelect,
    }),
  ]);
  const serialize = (row: { slug: string; titleBn: string; titleEn: string } | null) =>
    row ? { slug: row.slug, title: { bn: row.titleBn, en: row.titleEn } } : null;
  return { prev: serialize(older), next: serialize(newer) };
}

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
