import { courses } from "@/content/courses";
import { blogArticles } from "@/content/blog";
import { clarificationTopics } from "@/content/research";
import type { Language } from "@/types";
import { STATIC_PAGES } from "@/content/search-pages";

/**
 * Unified client-safe search index over the static content corpus
 * (pages, courses, articles, research topics, quick actions).
 * Live data (notices, fatwa) is queried server-side on /search.
 */

export type SearchEntryType =
  | "page"
  | "course"
  | "article"
  | "topic"
  | "notice"
  | "fatwa"
  | "action"
  | "news"
  | "person"
  | "album";

export interface SearchEntry {
  id: string;
  type: SearchEntryType;
  href: string;
  titleBn: string;
  titleEn: string;
  excerptBn: string;
  excerptEn: string;
  /** Lowercase blob of extra matchable text (labels, categories, synonyms). */
  keywords: string;
}

function buildIndex(): SearchEntry[] {
  const entries: SearchEntry[] = STATIC_PAGES.map((page) => ({
    id: `page:${page.href}`,
    type: page.type,
    href: page.href,
    titleBn: page.titleBn,
    titleEn: page.titleEn,
    excerptBn: page.excerptBn,
    excerptEn: page.excerptEn,
    keywords: page.keywords.toLowerCase(),
  }));

  for (const course of courses) {
    entries.push({
      id: `course:${course.slug}`,
      type: "course",
      href: `/academics/courses/${course.slug}`,
      titleBn: course.titleBn,
      titleEn: course.titleEn,
      excerptBn: course.tagline.bn,
      excerptEn: course.tagline.en,
      keywords: [
        course.kind,
        course.durationLabel.bn,
        course.durationLabel.en,
        course.eligibilityLabel.bn,
        course.eligibilityLabel.en,
        course.summary.bn,
        course.summary.en,
        course.titleAr ?? "",
      ]
        .join(" ")
        .toLowerCase(),
    });
  }

  for (const article of blogArticles) {
    entries.push({
      id: `article:${article.slug}`,
      type: "article",
      href: `/media/blog/${article.slug}`,
      titleBn: article.title.bn,
      titleEn: article.title.en,
      excerptBn: article.excerpt.bn,
      excerptEn: article.excerpt.en,
      keywords: [
        article.category.bn,
        article.category.en,
        article.author,
        article.authorRole.bn,
        article.authorRole.en,
      ]
        .join(" ")
        .toLowerCase(),
    });
  }

  for (const topic of clarificationTopics) {
    entries.push({
      id: `topic:${topic.id}`,
      type: "topic",
      href: `/research/clarifications#topic-${topic.id}`,
      titleBn: topic.title.bn,
      titleEn: topic.title.en,
      excerptBn: topic.description.bn,
      excerptEn: topic.description.en,
      keywords: [topic.title.bn, topic.title.en, "shongshoy jawab clarification"].join(" ").toLowerCase(),
    });
  }

  return entries;
}

/** The static-content index (memoised per server/client runtime). */
export const searchIndex: SearchEntry[] = buildIndex();

export interface SearchHit {
  entry: SearchEntry;
  score: number;
}

/**
 * Token-based scoring search over the static index.
 * Every whitespace-separated token must match somewhere (AND semantics);
 * matches in titles score highest, then keywords, then excerpts.
 */
export function searchStaticEntries(query: string, limit = 12): SearchHit[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const entry of searchIndex) {
    const title = `${entry.titleBn} ${entry.titleEn}`.toLowerCase();
    const excerpt = `${entry.excerptBn} ${entry.excerptEn}`.toLowerCase();
    let total = 0;
    let matchedAll = true;

    for (const token of tokens) {
      let tokenScore = 0;
      if (title.includes(token)) tokenScore += 3;
      if (entry.keywords.includes(token)) tokenScore += 2;
      if (excerpt.includes(token)) tokenScore += 1;
      if (tokenScore === 0) {
        matchedAll = false;
        break;
      }
      total += tokenScore;
    }

    if (matchedAll && total > 0) {
      hits.push({ entry, score: total });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

/** Popular search chips shown on the search landing state. */
export const POPULAR_QUERIES: { bn: string; en: string; q: string }[] = [
  { bn: "ভর্তি", en: "Admission", q: "ভর্তি" },
  { bn: "যাকাত", en: "Zakat", q: "যাকাত" },
  { bn: "ফতোয়া", en: "Fatwa", q: "ফতোয়া" },
  { bn: "স্কলারশিপ", en: "Scholarship", q: "স্কলারশিপ" },
  { bn: "সায়েন্টিজম", en: "Scientism", q: "সায়েন্টিজম" },
  { bn: "ভর্তি বিজ্ঞপ্তি", en: "Notices", q: "নোটিশ" },
  { bn: "কোর্স", en: "Courses", q: "course" },
  { bn: "ডাউনলোড", en: "Downloads", q: "download" },
];

export function entryTitle(entry: SearchEntry, lang: Language): string {
  return lang === "bn" ? entry.titleBn : entry.titleEn;
}

export function entryExcerpt(entry: SearchEntry, lang: Language): string {
  return lang === "bn" ? entry.excerptBn : entry.excerptEn;
}
