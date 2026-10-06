import { db } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/settings";
import { richTextToPlain } from "@/lib/sanitize";
import { FATWA_CATEGORIES, type FatwaCategory } from "@/types";

/** Shared fatwa-bank preview for the homepage gateway (server component). */

export interface FatwaPreviewItem {
  id: string;
  slug: string;
  category: FatwaCategory;
  question: { bn: string; en: string };
  answer: { bn: string; en: string };
  answeredBy: string;
  publishedAt: string;
}

const PREVIEW_SELECT = {
  id: true,
  slug: true,
  questionBn: true,
  questionEn: true,
  answerBn: true,
  answerEn: true,
  answeredBy: true,
  publishedAt: true,
  category: { select: { key: true } },
} as const;

/**
 * Newest published fatwa entries for the homepage bank preview.
 * Empty when the fatwa feature flag is off (matches the page/API).
 * Answers are stored as sanitised rich HTML; the preview renders plain text.
 */
export async function listFatwaPreview(pageSize = 4): Promise<FatwaPreviewItem[]> {
  if (!(await isFeatureEnabled("fatwa"))) {
    return [];
  }

  const rows = await db.fatwaEntry.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: pageSize,
    select: PREVIEW_SELECT,
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    category: (FATWA_CATEGORIES.includes(row.category?.key as FatwaCategory)
      ? row.category?.key
      : "contemporary") as FatwaCategory,
    question: { bn: richTextToPlain(row.questionBn), en: richTextToPlain(row.questionEn) },
    answer: { bn: richTextToPlain(row.answerBn), en: richTextToPlain(row.answerEn) },
    answeredBy: row.answeredBy,
    publishedAt: row.publishedAt.toISOString(),
  }));
}
