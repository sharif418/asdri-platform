import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, FileQuestion, Sparkles } from "lucide-react";
import { getLang } from "@/lib/i18n-server";
import { db } from "@/lib/db";
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
import { toBnDigits, formatDate } from "@/lib/format";
import { pick } from "@/types";
import { dictionaries } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "সাইট অনুসন্ধান",
  description: "কোর্স, নোটিশ, ফতোয়া, ব্লগ আর্টিকেল ও পেজ — আস-সুন্নাহ ইনস্টিটিউটের সব কনটেন্ট এক জায়গায় খুঁজুন।",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

interface DbResults {
  notices: {
    slug: string;
    titleBn: string;
    titleEn: string;
    excerptBn: string;
    excerptEn: string;
    category: string;
    publishedAt: Date;
  }[];
  fatwas: {
    slug: string;
    category: string;
    questionBn: string;
    questionEn: string;
    answeredBy: string;
  }[];
  noticeTotal: number;
  fatwaTotal: number;
}

const EMPTY_RESULTS: DbResults = { notices: [], fatwas: [], noticeTotal: 0, fatwaTotal: 0 };

async function queryDatabase(q: string): Promise<DbResults> {
  try {
    const noticeWhere = {
      OR: [
        { titleBn: { contains: q } },
        { titleEn: { contains: q } },
        { excerptBn: { contains: q } },
        { excerptEn: { contains: q } },
      ],
    };
    const fatwaWhere = {
      OR: [
        { questionBn: { contains: q } },
        { questionEn: { contains: q } },
        { answerBn: { contains: q } },
        { answerEn: { contains: q } },
      ],
    };
    const [notices, fatwas, noticeTotal, fatwaTotal] = await Promise.all([
      db.notice.findMany({
        where: noticeWhere,
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: {
          slug: true,
          titleBn: true,
          titleEn: true,
          excerptBn: true,
          excerptEn: true,
          category: true,
          publishedAt: true,
        },
      }),
      db.fatwaEntry.findMany({
        where: fatwaWhere,
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: {
          slug: true,
          category: true,
          questionBn: true,
          questionEn: true,
          answeredBy: true,
        },
      }),
      db.notice.count({ where: noticeWhere }),
      db.fatwaEntry.count({ where: fatwaWhere }),
    ]);
    return { notices, fatwas, noticeTotal, fatwaTotal };
  } catch {
    return EMPTY_RESULTS;
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const lang = await getLang();

  const params = await searchParams;
  const rawQuery = (params.q ?? "").trim();
  const query = rawQuery.slice(0, 120); // defensive cap

  const dict = dictionaries[lang];

  const staticHits = query.length > 0 ? searchStaticEntries(query, 14) : [];
  const dbResults: DbResults = query.length > 0 ? await queryDatabase(query) : EMPTY_RESULTS;

  const grouped = new Map<SearchEntryType, ResultCardData[]>();
  for (const hit of staticHits) {
    const list = grouped.get(hit.entry.type) ?? [];
    list.push({
      id: hit.entry.id,
      type: hit.entry.type,
      href: hit.entry.href,
      title: entryTitle(hit.entry, lang),
      excerpt: entryExcerpt(hit.entry, lang),
    });
    grouped.set(hit.entry.type, list);
  }

  const noticeResults: ResultCardData[] = dbResults.notices.map((row) => ({
    id: `notice:${row.slug}`,
    type: "notice",
    href: `/notices?notice=${encodeURIComponent(row.slug)}`,
    title: lang === "bn" ? row.titleBn : row.titleEn,
    excerpt: lang === "bn" ? row.excerptBn : row.excerptEn,
    meta: `${lang === "bn" ? "নোটিশ" : "Notice"} · ${formatDate(row.publishedAt, lang)}`,
  }));

  const fatwaResults: ResultCardData[] = dbResults.fatwas.map((row) => ({
    id: `fatwa:${row.slug}`,
    type: "fatwa",
    href: `/research/fatwa?focus=${encodeURIComponent(row.slug)}`,
    title: lang === "bn" ? row.questionBn : row.questionEn,
    excerpt: lang === "bn" ? `${row.answeredBy} কর্তৃক উত্তরপ্রাপ্ত` : `Answered by ${row.answeredBy}`,
    meta: lang === "bn" ? "ফতোয়া" : "Fatwa",
  }));

  const total =
    staticHits.length + noticeResults.length + fatwaResults.length;

  const allSections: { type: SearchEntryType; label: string; items: ResultCardData[]; footer?: ReactNode }[] = [
    { type: "course", label: dict["search.courses"], items: grouped.get("course") ?? [] },
    { type: "page", label: dict["search.pages"], items: grouped.get("page") ?? [] },
    { type: "article", label: dict["search.articles"], items: grouped.get("article") ?? [] },
    { type: "topic", label: dict["search.topics"], items: grouped.get("topic") ?? [] },
    { type: "action", label: dict["search.actions"], items: grouped.get("action") ?? [] },
    {
      type: "notice",
      label: dict["search.notices"],
      items: noticeResults,
      footer:
        dbResults.noticeTotal > noticeResults.length ? (
          <Link
            href="/notices"
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
            href={`/research/fatwa?q=${encodeURIComponent(query)}`}
            className="link-sweep mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary dark:text-gold"
          >
            {lang === "bn"
              ? `ফতোয়া ব্যাংকে সব দেখুন (${toBnDigits(dbResults.fatwaTotal)})`
              : `Search all in the fatwa bank (${dbResults.fatwaTotal})`}
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        ) : undefined,
    },
  ];
  const sectionOrder = allSections.filter((section) => section.items.length > 0);

  const showLanding = query.length === 0;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "অনুসন্ধান" : "Search"}
        title={dict["search.title"]}
        description={dict["search.subtitle"]}
        lang={lang}
        breadcrumb={[{ label: { bn: "হোম", en: "Home" }, href: "/" }, { label: dict["search.title"] }]}
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
                    href={`/search?q=${encodeURIComponent(item.q)}`}
                    className="rounded-full border border-gold/30 bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-gold hover:bg-gold-soft hover:text-gold-foreground dark:hover:text-accent-foreground"
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
                          href={`/search?q=${encodeURIComponent(item.q)}`}
                          className="rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:border-gold hover:text-primary"
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
