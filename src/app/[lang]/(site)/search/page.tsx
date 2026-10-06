import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, FileQuestion, Sparkles } from "lucide-react";
import type { Lang } from "@/lib/locale";
import { alternatesFor, langPath } from "@/lib/locale";
import { env } from "@/lib/env";
import {
  EMPTY_SEARCH_PAGE_RESULTS,
  searchPageDatabase,
  toFatwaResult,
  toNoticeResult,
  type SearchPageResults,
} from "@/lib/search-view";
import { getEnabledFlags } from "@/lib/settings";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { SearchBox } from "@/components/search/search-box";
import { ResultCard, ResultSection, type ResultCardData } from "@/components/search/result-card";
import {
  POPULAR_QUERIES,
  entryExcerpt,
  entryTitle,
  searchStaticEntries,
  type SearchEntryType,
} from "@/lib/search-index";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import { dictionaries } from "@/lib/i18n";

/**
 * /search — static content index + the live database in one result list.
 * Search result pages are personal query state, never indexable content:
 * robots noindex, canonical/hreflang still emitted for both languages.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = dictionaries[lang];
  const { canonical, languages } = alternatesFor("/search", env.siteUrl);
  return {
    title: dict["search.metaTitle"],
    description: dict["search.metaDescription"],
    alternates: { canonical, languages },
    robots: { index: false, follow: true },
  };
}

interface SearchPageProps {
  params: Promise<{ lang: Lang }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { lang } = await params;

  const sp = await searchParams;
  const rawQuery = (sp.q ?? "").trim();
  const query = rawQuery.slice(0, 120); // defensive cap

  const dict = dictionaries[lang];

  const staticHits = query.length > 0 ? searchStaticEntries(query, 14) : [];
  const flags = query.length > 0 ? await getEnabledFlags() : null;
  const dbResults: SearchPageResults =
    query.length > 0 ? await searchPageDatabase(query, lang, flags) : EMPTY_SEARCH_PAGE_RESULTS;

  const grouped = new Map<SearchEntryType, ResultCardData[]>();
  for (const hit of staticHits) {
    const list = grouped.get(hit.entry.type) ?? [];
    list.push({
      id: hit.entry.id,
      type: hit.entry.type,
      href: langPath(lang, hit.entry.href),
      title: entryTitle(hit.entry, lang),
      excerpt: entryExcerpt(hit.entry, lang),
    });
    grouped.set(hit.entry.type, list);
  }

  // Live database entries merge into the matching static sections — the
  // static corpus and the seeded rows describe the same slugs, so dedupe by
  // canonical href keeps every item listed exactly once (static hits keep
  // their token ranking; live extras append after them).
  const staticHrefs = new Set(staticHits.map((hit) => hit.entry.href));
  const canonicalHref = (href: string) => (lang === "en" && href.startsWith("/en") ? href.slice(3) : href);
  const appendLive = (type: SearchEntryType, items: SearchPageResults["posts"]) => {
    for (const item of items) {
      if (staticHrefs.has(canonicalHref(item.href))) continue;
      const list = grouped.get(type) ?? [];
      list.push({ id: item.id, type: item.type, href: item.href, title: item.title, excerpt: item.excerpt, meta: item.meta });
      grouped.set(type, list);
    }
  };
  appendLive("course", dbResults.courses);
  appendLive("article", dbResults.posts.filter((item) => item.type === "article"));

  const noticeResults: ResultCardData[] = dbResults.notices.map((row) => toNoticeResult(row, lang));
  const fatwaResults: ResultCardData[] = dbResults.fatwas.map((row) => toFatwaResult(row, lang));

  const newsResults: ResultCardData[] = dbResults.posts.filter((item) => item.type === "news");
  const peopleResults: ResultCardData[] = dbResults.people.map((item) => ({ ...item }));
  const albumResults: ResultCardData[] = dbResults.albums.map((item) => ({ ...item }));

  const allSections: { type: SearchEntryType; label: string; items: ResultCardData[]; footer?: ReactNode }[] = [
    { type: "course", label: dict["search.courses"], items: grouped.get("course") ?? [] },
    { type: "page", label: dict["search.pages"], items: grouped.get("page") ?? [] },
    { type: "article", label: dict["search.articles"], items: grouped.get("article") ?? [] },
    { type: "news", label: dict["search.news"], items: newsResults },
    { type: "topic", label: dict["search.topics"], items: grouped.get("topic") ?? [] },
    { type: "action", label: dict["search.actions"], items: grouped.get("action") ?? [] },
    { type: "person", label: dict["search.people"], items: peopleResults },
    {
      type: "notice",
      label: dict["search.notices"],
      items: noticeResults,
      footer:
        dbResults.noticeTotal > noticeResults.length ? (
          <Link
            href={langPath(lang, "/notices")}
            className="link-sweep mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary dark:text-gold"
          >
            {lang === "bn"
              ? `নোটিশ বোর্ডে সব দেখুন (${toBnDigits(dbResults.noticeTotal)})`
              : `View all on the notice board (${dbResults.noticeTotal})`}
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        ) : undefined,
    },
    {
      type: "fatwa",
      label: dict["search.fatwas"],
      items: fatwaResults,
      footer:
        dbResults.fatwaTotal > fatwaResults.length ? (
          <Link
            href={langPath(lang, `/research/fatwa?q=${encodeURIComponent(query)}`)}
            className="link-sweep mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary dark:text-gold"
          >
            {lang === "bn"
              ? `ফতোয়া ব্যাংকে সব দেখুন (${toBnDigits(dbResults.fatwaTotal)})`
              : `Search all in the fatwa bank (${dbResults.fatwaTotal})`}
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        ) : undefined,
    },
    { type: "album", label: dict["search.albums"], items: albumResults },
  ];
  const sectionOrder = allSections.filter((section) => section.items.length > 0);
  const total = sectionOrder.reduce((sum, section) => sum + section.items.length, 0);

  const showLanding = query.length === 0;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "অনুসন্ধান" : "Search"}
        title={dict["search.title"]}
        description={dict["search.subtitle"]}
        lang={lang}
        breadcrumb={[{ label: { bn: "হোম", en: "Home" }, href: langPath(lang, "/") }, { label: dict["search.title"] }]}
        arabicEcho="وَقُل رَّبِّ زِدْنِي عِلْمًا"
      >
        <SearchBox initialQuery={rawQuery} autoFocus size="hero" />
      </PageHero>

      <section className="bg-parchment/60 py-10 sm:py-14 dark:bg-secondary/30">
        <div className="container-site">
          {showLanding ? (
            <Reveal delay={0.1}>
              <div className="text-center">
                <Sparkles aria-hidden className="mx-auto h-8 w-8 text-gold" />
                <h2 className="mt-3 font-serif text-xl font-semibold text-foreground">
                  {dict["search.popular"]}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{dict["search.typeSomething"]}</p>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                {POPULAR_QUERIES.map((item) => (
                  <Link
                    key={item.q}
                    href={langPath(lang, `/search?q=${encodeURIComponent(item.q)}`)}
                    className="rounded-full border border-gold/30 bg-card px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-gold-soft hover:text-gold-foreground hover:shadow-sm hover:shadow-gold/20 dark:hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment dark:focus-visible:ring-offset-secondary"
                  >
                    {pick({ bn: item.bn, en: item.en }, lang)}
                  </Link>
                ))}
              </div>
            </Reveal>
          ) : (
            <div>
              <p className="text-center text-sm text-muted-foreground">
                {dict["search.resultsFor"]}{" "}
                <span className="font-serif text-[15px] font-semibold text-foreground">
                  “{query}”
                </span>
                {total > 0 && (
                  <>
                    {" — "}
                    <span className="font-bold text-primary">
                      {lang === "bn" ? toBnDigits(total) : total} {dict["search.total"]}
                    </span>
                  </>
                )}
              </p>

              {total === 0 ? (
                <Reveal className="mt-8">
                  <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
                    <FileQuestion aria-hidden className="mx-auto h-10 w-10 text-muted-foreground/60" />
                    <h2 className="mt-4 font-serif text-lg font-semibold text-foreground">
                      {dict["search.noResults"]}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {dict["search.noResultsHint"]}
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {POPULAR_QUERIES.slice(0, 4).map((item) => (
                        <Link
                          key={item.q}
                          href={langPath(lang, `/search?q=${encodeURIComponent(item.q)}`)}
                          className="rounded-full border border-gold/30 bg-card px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 hover:border-gold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                        >
                          {pick({ bn: item.bn, en: item.en }, lang)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ) : (
                <div className="mt-8 grid gap-10">
                  {sectionOrder.map((section, index) => (
                    <Reveal key={section.type + section.label} delay={index * 0.05}>
                      <ResultSection title={section.label} count={section.items.length} footer={section.footer}>
                        {section.items.map((item) => (
                          <ResultCard key={item.id} result={item} lang={lang} query={query} />
                        ))}
                      </ResultSection>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
