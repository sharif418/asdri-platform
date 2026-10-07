import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { rotateFallback } from "@/lib/content/html";
import type { BlogArticle } from "@/types";

/**
 * DB → view-model adapters for the blog (Post where kind = ARTICLE). Bodies
 * are stored as markdown in the seed but rich HTML when authored from the
 * admin, so `toMarkdown` converts basic HTML before the react-markdown prose
 * renderer sees it.
 */

const AUTHOR_FALLBACK_BN = "আস-সুন্নাহ গবেষণা বোর্ড";
const AUTHOR_FALLBACK_EN = "As-Sunnah Research Board";

/** Cover rotation for articles without uploaded cover media. */
const COVER_FALLBACKS = [
  "/images/blog-science.png",
  "/images/blog-secularism.png",
  "/images/blog-atheism.png",
  "/images/blog-feminism.png",
  "/images/blog-orientalism.png",
] as const;

/** Convert simple rich-HTML to markdown lines; plain markdown passes through. */
export function toMarkdown(source: string): string {
  const value = source.trim();
  if (!value) return "";
  const looksLikeHtml = /<\/?(p|h[1-6]|ul|ol|li|strong|em|blockquote)\b/i.test(value);
  if (!looksLikeHtml) return value;

  const blocks = value.match(/<(h[1-6]|li|p|blockquote)[^>]*>[\s\S]*?<\/\1>|<[^>]+>/gi) ?? [];
  const lines: string[] = [];
  for (const block of blocks) {
    const text = block.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const tag = block.match(/^<(h[1-6]|li|p|blockquote)/i)?.[1]?.toLowerCase();
    if (tag?.startsWith("h")) {
      const level = Number(tag.slice(1));
      lines.push(`${"#".repeat(Math.min(6, Math.max(1, level)))} ${text}\n`);
    } else if (tag === "li") {
      lines.push(`- ${text}`);
    } else if (tag === "blockquote") {
      lines.push(`> ${text}\n`);
    } else {
      lines.push(`${text}\n`);
    }
  }
  const inline = lines
    .join("\n")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return inline || value.replace(/<[^>]+>/g, "").trim();
}

interface DbArticle {
  slug: string;
  titleBn: string;
  titleEn: string;
  excerptBn: string;
  excerptEn: string;
  bodyBn: string;
  bodyEn: string;
  readingMinutes: number | null;
  publishedAt: Date | null;
  category: { nameBn: string; nameEn: string } | null;
  author: { nameBn: string; nameEn: string; titleBn: string; titleEn: string } | null;
  coverMedia: { key: string } | null;
}

const ARTICLE_SELECT = {
  slug: true,
  titleBn: true,
  titleEn: true,
  excerptBn: true,
  excerptEn: true,
  bodyBn: true,
  bodyEn: true,
  readingMinutes: true,
  publishedAt: true,
  isPublished: true,
  category: { select: { nameBn: true, nameEn: true } },
  author: { select: { nameBn: true, nameEn: true, titleBn: true, titleEn: true } },
  coverMedia: { select: { key: true } },
} as const;

function toArticle(row: DbArticle, index: number): BlogArticle {
  const authorBn = row.author?.nameBn || AUTHOR_FALLBACK_BN;
  const authorEn = row.author?.nameEn || row.author?.nameBn || AUTHOR_FALLBACK_EN;
  return {
    slug: row.slug,
    title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
    excerpt: { bn: row.excerptBn, en: row.excerptEn || row.excerptBn },
    category: {
      bn: row.category?.nameBn ?? "গবেষণা প্রবন্ধ",
      en: row.category?.nameEn ?? row.category?.nameBn ?? "Research Essays",
    },
    author: authorBn,
    authorRole: {
      bn: row.author?.titleBn ?? "গবেষক",
      en: row.author?.titleEn || row.author?.titleBn || "Researcher",
    },
    publishedAt: (row.publishedAt ?? new Date()).toISOString(),
    readMinutes: row.readingMinutes ?? 6,
    cover: row.coverMedia ? `/api/media/${row.coverMedia.key}` : rotateFallback(COVER_FALLBACKS, index),
    contentBn: toMarkdown(row.bodyBn),
    contentEn: row.bodyEn ? toMarkdown(row.bodyEn) : undefined,
  };
}

/** Published research articles, newest first. */
export async function getBlogArticles(): Promise<BlogArticle[]> {
  const rows = await db.post.findMany({
    where: { kind: "ARTICLE", isPublished: true },
    orderBy: { publishedAt: "desc" },
    select: ARTICLE_SELECT,
  });
  return rows.map((row, index) => toArticle(row, index));
}

/* ————————— Paginated blog index (round 7) ————————— */

export interface PostListQuery {
  /** 1-based page number (out-of-range pages clamp to the last page). */
  page?: number;
  pageSize?: number;
  /** PostCategory slug — covers `clar-<topicId>` deep-links from the research pages. */
  categorySlug?: string;
  /** PostCategory Bengali name — chips for categories whose slug is empty. */
  categoryName?: string;
}

export interface PostListResult {
  articles: BlogArticle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Published ARTICLE posts, newest first, page-sliced with the full total. */
export async function listPublishedPosts({
  page = 1,
  pageSize = 9,
  categorySlug,
  categoryName,
}: PostListQuery): Promise<PostListResult> {
  const where: Prisma.PostWhereInput = {
    kind: "ARTICLE",
    isPublished: true,
    // Same visibility rule as the notice board: unpublished and future-dated
    // posts are indistinguishable from missing ones.
    publishedAt: { not: null, lte: new Date() },
    ...(categorySlug
      ? { category: { slug: categorySlug } }
      : categoryName
        ? { category: { nameBn: categoryName } }
        : {}),
  };

  const [total, rows] = await Promise.all([
    db.post.count({ where }),
    db.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: ARTICLE_SELECT,
    }),
  ]);
  return {
    articles: rows.map((row, index) => toArticle(row, index)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export interface PostCategoryFacet {
  /** May be empty (a seeded category has no slug) — chips then filter by name. */
  slug: string;
  name: { bn: string; en: string };
  /** Published ARTICLE posts in the category. */
  count: number;
}

/** Category chips for the blog index — only categories with published articles. */
export async function listPostCategoryFacets(): Promise<PostCategoryFacet[]> {
  const visible: Prisma.PostWhereInput = {
    kind: "ARTICLE",
    isPublished: true,
    publishedAt: { not: null, lte: new Date() },
  };
  const [categories, counts] = await Promise.all([
    db.postCategory.findMany({
      where: { posts: { some: visible } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, nameBn: true, nameEn: true },
    }),
    db.post.groupBy({ by: ["categoryId"], where: visible, _count: { _all: true } }),
  ]);
  const countById = new Map(counts.map((row) => [row.categoryId, row._count._all]));
  return categories.map((category) => ({
    slug: category.slug,
    name: { bn: category.nameBn, en: category.nameEn },
    count: countById.get(category.id) ?? 0,
  }));
}

/** Single article by slug (published only). */
export async function getArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const row = await db.post.findUnique({ where: { slug }, select: ARTICLE_SELECT });
  if (!row || !row.isPublished) return null;
  return toArticle(row, 0);
}

/**
 * Preview variant (round 4 ws 5): by id, ignores the published gate. Reached
 * only through a signed /preview/<token> link; same view-model as the
 * permalink so the render is identical.
 */
export async function getPostForPreview(id: string): Promise<BlogArticle | null> {
  const row = await db.post.findUnique({ where: { id }, select: ARTICLE_SELECT });
  if (!row) return null;
  return toArticle(row, 0);
}

/** Articles of a clarification topic (category slug `clar-<topicId>`). */
export async function getArticlesByCategorySlug(categorySlug: string): Promise<BlogArticle[]> {
  const rows = await db.post.findMany({
    where: {
      kind: "ARTICLE",
      isPublished: true,
      category: { slug: categorySlug },
    },
    orderBy: { publishedAt: "desc" },
    select: ARTICLE_SELECT,
  });
  return rows.map((row, index) => toArticle(row, index));
}

/** Related articles: same category, excluding the current slug. */
export async function getRelatedArticles(slug: string, limit = 3): Promise<BlogArticle[]> {
  const current = await getArticleBySlug(slug);
  if (!current) return [];
  const rows = await db.post.findMany({
    where: {
      isPublished: true,
      kind: "ARTICLE",
      slug: { not: slug },
      OR: [{ categoryId: { not: null } }],
    },
    orderBy: { publishedAt: "desc" },
    take: limit + 2,
    select: { slug: true, categoryId: true },
  });
  void rows;
  // simpler: fetch articles and filter by same category label in view space
  const all = await getBlogArticles();
  return all
    .filter((a) => a.slug !== slug && a.category.bn === current.category.bn)
    .slice(0, limit);
}
