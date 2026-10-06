import { db } from "@/lib/db";
import { langPath, type Lang } from "@/lib/locale";
import { formatDate } from "@/lib/format";
import {
  orderByIds,
  searchAlbumEntries,
  searchCourseEntries,
  searchFatwaEntries,
  searchNoticeEntries,
  searchPersonEntries,
  searchPostEntries,
  type IdRankResult,
  type LiveSearchResult,
} from "@/lib/db-search";
import type { ResultCardData } from "@/components/search/result-card";

/**
 * /search view-model layer — the page's database orchestration and DTO
 * mapping live here so tests can pin them without rendering the page.
 * Notice and fatwa results hydrate from the ranked id search; the live
 * content corpus (posts, courses, people, albums) arrives pre-mapped.
 * Modules the office switched off (feature flags, fail-open for unknown
 * keys) contribute no results — exactly like their pages render unavailable.
 */

/** Hydrated notice row as selected for the search page. */
export interface NoticeSearchRow {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  excerptBn: string;
  excerptEn: string;
  publishedAt: Date;
}

/** Hydrated fatwa row as selected for the search page. */
export interface FatwaSearchRow {
  id: string;
  slug: string;
  category: { key: string; nameBn: string; nameEn: string } | null;
  questionBn: string;
  questionEn: string;
  answeredBy: string;
}

/** Notice row → result card pointing at the canonical /notices/[slug] permalink. */
export function toNoticeResult(row: NoticeSearchRow, lang: Lang): ResultCardData {
  return {
    id: `notice:${row.slug}`,
    type: "notice",
    href: langPath(lang, `/notices/${row.slug}`),
    title: lang === "bn" ? row.titleBn : row.titleEn,
    excerpt: lang === "bn" ? row.excerptBn : row.excerptEn,
    meta: `${lang === "bn" ? "নোটিশ" : "Notice"} · ${formatDate(row.publishedAt, lang)}`,
  };
}

/** Fatwa row → result card deep-linking the fatwa bank's focus param. */
export function toFatwaResult(row: FatwaSearchRow, lang: Lang): ResultCardData {
  return {
    id: `fatwa:${row.slug}`,
    type: "fatwa",
    href: langPath(lang, `/research/fatwa?focus=${encodeURIComponent(row.slug)}`),
    title: lang === "bn" ? row.questionBn : row.questionEn,
    excerpt:
      lang === "bn" ? `${row.answeredBy} কর্তৃক উত্তরপ্রাপ্ত` : `Answered by ${row.answeredBy}`,
    meta: lang === "bn" ? "ফতোয়া" : "Fatwa",
  };
}

export interface SearchPageResults {
  notices: NoticeSearchRow[];
  fatwas: FatwaSearchRow[];
  posts: LiveSearchResult[];
  courses: LiveSearchResult[];
  people: LiveSearchResult[];
  albums: LiveSearchResult[];
  noticeTotal: number;
  fatwaTotal: number;
}

const EMPTY_RESULTS: SearchPageResults = {
  notices: [],
  fatwas: [],
  posts: [],
  courses: [],
  people: [],
  albums: [],
  noticeTotal: 0,
  fatwaTotal: 0,
};

/** Shared empty result — the landing state (no query) renders no live sections. */
export const EMPTY_SEARCH_PAGE_RESULTS: SearchPageResults = EMPTY_RESULTS;

const EMPTY_RANK: IdRankResult = { ids: [], rankById: new Map(), total: 0, mode: "fallback" };

/** One parallel sweep across every live source the search page renders. */
export async function searchPageDatabase(
  q: string,
  lang: Lang,
  flags: Map<string, boolean> | null,
): Promise<SearchPageResults> {
  const flagOn = (key: string) => flags?.get(key) ?? true;
  try {
    const [noticeSearch, fatwaSearch, posts, courses, people, albums] = await Promise.all([
      flagOn("notices") ? searchNoticeEntries({ q, skip: 0, take: 5 }) : Promise.resolve(EMPTY_RANK),
      flagOn("fatwa") ? searchFatwaEntries({ q, skip: 0, take: 5 }) : Promise.resolve(EMPTY_RANK),
      flagOn("blog") ? searchPostEntries(q, lang, 5) : Promise.resolve([] as LiveSearchResult[]),
      searchCourseEntries(q, lang, 5),
      searchPersonEntries(q, lang, 5),
      flagOn("gallery") ? searchAlbumEntries(q, lang, 5) : Promise.resolve([] as LiveSearchResult[]),
    ]);
    const [notices, fatwas] = await Promise.all([
      noticeSearch.ids.length > 0
        ? db.notice.findMany({
            where: { id: { in: noticeSearch.ids }, isPublished: true },
            select: {
              id: true,
              slug: true,
              titleBn: true,
              titleEn: true,
              excerptBn: true,
              excerptEn: true,
              category: true,
              publishedAt: true,
            },
          })
        : Promise.resolve([] as NoticeSearchRow[]),
      fatwaSearch.ids.length > 0
        ? db.fatwaEntry.findMany({
            where: { id: { in: fatwaSearch.ids }, isPublished: true },
            select: {
              id: true,
              slug: true,
              category: { select: { key: true, nameBn: true, nameEn: true } },
              questionBn: true,
              questionEn: true,
              answeredBy: true,
            },
          })
        : Promise.resolve([] as FatwaSearchRow[]),
    ]);
    return {
      notices: orderByIds(notices, noticeSearch.ids) as NoticeSearchRow[],
      fatwas: orderByIds(fatwas, fatwaSearch.ids) as FatwaSearchRow[],
      posts,
      courses,
      people,
      albums,
      noticeTotal: noticeSearch.total,
      fatwaTotal: fatwaSearch.total,
    };
  } catch {
    return EMPTY_RESULTS;
  }
}
