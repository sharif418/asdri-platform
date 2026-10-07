import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookMarked, FileQuestion, SearchX } from "lucide-react";
import { alternatesFor, langPath, type Lang } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { env } from "@/lib/env";
import { formatNumber } from "@/lib/format";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { GoldRule } from "@/components/shared/ornaments";
import { SitePagination } from "@/components/shared/site-pagination";
import {
  LibraryFilters,
  type LibraryFilterValues,
} from "@/components/library/library-filters";
import { LibraryCard } from "@/components/library/library-card";
import { LibraryJournalGroups } from "@/components/library/library-journal-groups";
import { buildLibraryUrl } from "@/components/library/library-shared";
import {
  getLibraryCategories,
  getLibraryLanguages,
  getLibraryYears,
  getJournalGroups,
} from "@/lib/content/library-shelves";
import { searchLibraryItems } from "@/lib/content/library-search";
import { getSiteConfig } from "@/lib/content/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Lang }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const siteConfig = await getSiteConfig();
  const { canonical, languages } = alternatesFor(
    "/research/library",
    env.siteUrl,
  );
  return {
    title:
      lang === "bn"
        ? `লাইব্রেরি ও জার্নাল — ${siteConfig.nameBn}`
        : `Library & Journals — ${siteConfig.nameEn}`,
    description:
      lang === "bn"
        ? "অনুসন্ধানযোগ্য লাইব্রেরি ক্যাটালগ — বই, জার্নাল সংখ্যা ও গবেষণাপত্র; প্রতিটি আইটেমের রেকর্ড পাতায় সাইটেশন জেনারেটর ও ব্রাউজারেই পিডিএফ রিডার।"
        : "A searchable library catalogue — books, journal issues, and papers; every record page carries a citation generator and an in-browser PDF reader.",
    alternates: { canonical, languages },
    // a nav destination like the blog list: indexed, canonical absorbs ?q= states
    robots: { index: true, follow: true },
  };
}

const PAGE_SIZE = 12;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
}

/** Catalogue — bilingual search + facets + journals by issue + pagination. */
export default async function LibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Lang }>;
  searchParams: SearchParams;
}) {
  const { lang } = await params;
  if (!(await isFeatureEnabled("research"))) {
    return (
      <ModuleUnavailable
        lang={lang}
        moduleLabelBn="লাইব্রেরি ও জার্নাল"
        moduleLabelEn="Library & journals"
      />
    );
  }
  const bn = lang === "bn";
  const sp = await searchParams;

  const values: LibraryFilterValues = {
    q: firstParam(sp.q).slice(0, 120),
    type: firstParam(sp.type),
    category: firstParam(sp.category),
    year: firstParam(sp.year),
    language: firstParam(sp.language),
    journalKey: firstParam(sp.journal),
  };
  const requestedPage = Number.parseInt(firstParam(sp.page) || "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [result, categories, years, languages, journalGroups, catalogueSize] =
    await Promise.all([
      searchLibraryItems({
        q: values.q,
        type: values.type,
        category: values.category,
        year: values.year ? Number.parseInt(values.year, 10) : null,
        language: values.language,
        journalKey: values.journalKey,
        page,
        perPage: PAGE_SIZE,
      }),
      getLibraryCategories(),
      getLibraryYears(),
      getLibraryLanguages(),
      getJournalGroups(),
      searchLibraryItems({ page: 1, perPage: 1 }), // total shelf size for the hero pill
    ]);

  const hasAnyFilter = Boolean(
    values.q ||
    values.type ||
    values.category ||
    values.year ||
    values.language ||
    values.journalKey,
  );
  const safePage = Math.min(page, result.totalPages);
  const firstShown = result.total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(safePage * PAGE_SIZE, result.total);

  return (
    <>
      <PageHero
        eyebrow={bn ? "গবেষণা ও প্রকাশনা" : "Research & Publications"}
        title={bn ? "লাইব্রেরি ও জার্নাল" : "Library & Journals"}
        description={
          bn
            ? "ইনস্টিটিউটের বই, জার্নাল সংখ্যা ও গবেষণাপত্রের অনুসন্ধানযোগ্য ক্যাটালগ — দুই ভাষাতেই খুঁজুন, প্রতিটি আইটেমের রেকর্ড থেকে সাইটেশন কপি করুন বা ব্রাউজারেই পড়া শুরু করুন।"
            : "A searchable catalogue of the institute's books, journal issues, and research papers — search in either language, copy a citation from any record, or start reading in the browser."
        }
        lang={lang}
        section="research"
        breadcrumb={[
          {
            label: bn ? "গবেষণা" : "Research",
            href: langPath(lang, "/research"),
          },
          { label: bn ? "লাইব্রেরি ও জার্নাল" : "Library & Journals" },
        ]}
        arabicEcho="اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ"
        meta={{
          textBn: `ক্যাটালগে ${formatNumber(catalogueSize.total, "bn")}টি আইটেম`,
          textEn: `${catalogueSize.total} items in the catalogue`,
        }}
      />

      <section className="bg-parchment/60 py-10 sm:py-14 dark:bg-secondary/30">
        <div className="container-site">
          {/* ————— search + filters (GET form — no JS required) ————— */}
          <Reveal>
            <LibraryFilters
              lang={lang}
              values={values}
              categories={categories}
              years={years}
              languages={languages}
            />
          </Reveal>

          {/* ————— journals by issue (unfiltered shelf only) ————— */}
          {!hasAnyFilter && journalGroups.length > 0 ? (
            <Reveal className="mt-12" delay={0.05}>
              <SectionHeading
                eyebrow={bn ? "পত্রিকা" : "Periodicals"}
                title={bn ? "জার্নাল ও পত্রিকা" : "Journals & Periodicals"}
                description={
                  bn
                    ? "প্রতিটি জার্নাল তার সংখ্যা অনুযায়ী সাজানো — যেকোনো সংখ্যায় সরাসরি ঢুকে পড়ুন।"
                    : "Every journal organised by its issues — jump straight into any of them."
                }
                lang={lang}
              />
              <Stagger className="mt-8">
                <LibraryJournalGroups groups={journalGroups} lang={lang} />
              </Stagger>
            </Reveal>
          ) : null}

          {/* ————— results ————— */}
          <Reveal className="mt-12" delay={0.05}>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold">
                {hasAnyFilter
                  ? bn
                    ? "অনুসন্ধানের ফলাফল"
                    : "Search results"
                  : bn
                    ? "সম্পূর্ণ ক্যাটালগ"
                    : "The full catalogue"}
              </h2>
              <p className="text-[12.5px] text-muted-foreground">
                {result.total === 0
                  ? bn
                    ? "কিছু পাওয়া যায়নি"
                    : "Nothing found"
                  : bn
                    ? `${formatNumber(firstShown, "bn")}–${formatNumber(lastShown, "bn")} / মোট ${formatNumber(result.total, "bn")}টি`
                    : `${firstShown}–${lastShown} of ${result.total}`}
              </p>
            </div>

            {result.items.length === 0 ? (
              <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-gold/40 bg-card px-6 py-14 text-center">
                {hasAnyFilter ? (
                  <SearchX
                    aria-hidden
                    className="mx-auto h-10 w-10 text-muted-foreground/60"
                  />
                ) : (
                  <FileQuestion
                    aria-hidden
                    className="mx-auto h-10 w-10 text-muted-foreground/60"
                  />
                )}
                <h3 className="font-heading mt-4 text-base font-semibold">
                  {bn
                    ? "এই অনুসন্ধানে কোনো আইটেম পাওয়া যায়নি"
                    : "No items match this search"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {bn
                    ? "বানান পরীক্ষা করুন বা ফিল্টার একটু কমিয়ে আবার চেষ্টা করুন।"
                    : "Check the spelling, or loosen the filters and try again."}
                </p>
                {hasAnyFilter ? (
                  <Link
                    href={buildLibraryUrl(lang, {})}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {bn ? "সব ফিল্টার মুছুন" : "Clear all filters"}
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ) : (
              <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((item) => (
                  <RevealItem key={item.id}>
                    <LibraryCard item={item} lang={lang} />
                  </RevealItem>
                ))}
              </Stagger>
            )}
          </Reveal>

          <SitePagination
            page={safePage}
            totalPages={result.totalPages}
            buildUrl={(pageNumber) =>
              buildLibraryUrl(lang, {
                q: values.q,
                type: values.type,
                category: values.category,
                year: values.year,
                language: values.language,
                journalKey: values.journalKey,
                page: pageNumber,
              })
            }
            lang={lang}
            labels={{
              prev: bn ? "পূর্ববর্তী পাতা" : "Previous page",
              next: bn ? "পরবর্তী পাতা" : "Next page",
              nav: bn ? "লাইব্রেরি পেজিনেশন" : "Library pagination",
              page: (pageNumber) =>
                bn
                  ? `পাতা ${formatNumber(pageNumber, "bn")}`
                  : `Page ${pageNumber}`,
              status: (pageNumber, totalPages) =>
                bn
                  ? `পাতা ${formatNumber(pageNumber, "bn")} / ${formatNumber(totalPages, "bn")}`
                  : `Page ${pageNumber} of ${totalPages}`,
            }}
          />
        </div>
      </section>

      {/* ————— reference downloads (link-out) ————— */}
      <section className="py-12 sm:py-16">
        <div className="container-site">
          <Reveal>
            <GoldRule />
            <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-2xl border bg-card p-6 text-center shadow-sm sm:flex-row sm:text-left">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                  <BookMarked aria-hidden className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-heading text-base font-semibold">
                    {bn ? "প্রসপেক্টাস ও সিলেবাস" : "Prospectus & Syllabus"}
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {bn
                      ? "গবেষণার সঙ্গে সরাসরি সম্পর্কিত রেফারেন্স ডকুমেন্ট — ডাউনলোড কেন্দ্রে গিয়ে নিন।"
                      : "The reference documents that matter to research — collect them from the download center."}
                  </p>
                </div>
              </div>
              <Link
                href={langPath(lang, "/academics/downloads")}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gold/50 px-6 py-2.5 text-[13px] font-semibold text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
              >
                {bn ? "ডাউনলোড কেন্দ্রে যান" : "Open the download center"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 text-center">
              <Link
                href={langPath(lang, "/research/publications")}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {bn
                  ? "শিক্ষক-গবেষকদের প্রকাশনা দেখুন"
                  : "Browse Faculty Publications"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
