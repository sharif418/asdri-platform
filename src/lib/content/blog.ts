import { db } from "@/lib/db";
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
  category: { slug: string; nameBn: string; nameEn: string } | null;
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
  category: { select: { slug: true, nameBn: true, nameEn: true } },
  author: { select: { nameBn: true, nameEn: true, titleBn: true, titleEn: true } },
  coverMedia: { select: { key: true } },
} as const;

function toArticle(row: DbArticle, index: number): BlogArticle {
  const authorBn = row.author?.nameBn || AUTHOR_FALLBACK_BN;
  const authorEn = row.author?.nameEn || row.author?.nameBn || AUTHOR_FALLBACK_EN;
  const topicKey = row.category?.slug.startsWith("clar-") ? row.category.slug : undefined;
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
    topicKey,
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

/** Single article by slug (published only). */
export async function getArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const row = await db.post.findUnique({ where: { slug }, select: ARTICLE_SELECT });
  if (!row || !row.isPublished) return null;
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
