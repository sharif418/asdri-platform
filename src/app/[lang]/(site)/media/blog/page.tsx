import type { Metadata } from "next";
import Link from "next/link";
import { Filter, X } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { SitePagination } from "@/components/shared/site-pagination";
import { getClarificationTopics } from "@/lib/content/research";
import { listPostCategoryFacets, listPublishedPosts } from "@/lib/content/blog";
import { alternatesFor } from "@/lib/locale";
import { env } from "@/lib/env";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { BlogExplorer } from "@/components/media/blog-explorer";
import { toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { pick } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const { canonical, languages } = alternatesFor("/media/blog", env.siteUrl);
  return {
    title: lang === "bn" ? "ব্লগ ও প্রবন্ধ" : "Blog & Essays",
    description:
      lang === "bn"
        ? "সমকালীন ফিতনা ও সংশয় নিরসন, তুলনামূলক ধর্মতত্ত্ব, তাফসীর ও হাদীস গবেষণা — ইনস্টিটিউটের গবেষকদের প্রামাণ্য প্রবন্ধ।"
        : "Contemporary fitnah and doubt resolution, comparative religion, tafsir and hadith research — evidenced essays by the institute's researchers.",
    alternates: { canonical, languages },
    robots: { index: true, follow: true },
  };
}

const PAGE_SIZE = 9;

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Lang }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!(await isFeatureEnabled("blog"))) {
    return <ModuleUnavailable lang={lang} moduleLabelBn="ব্লগ ও প্রবন্ধ" moduleLabelEn="Blog & essays" />;
  }

  const sp = await searchParams;
  const firstParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  // ?topic=<clarification topic id> — legacy deep-link filter from the
  // clarifications page (maps onto the `clar-<topicId>` PostCategory slug).
  const rawTopic = firstParam(sp.topic);
  const topicFilter = rawTopic
    ? ((await getClarificationTopics()).find((topic) => topic.id === rawTopic) ?? null)
    : null;

  // ?category=<PostCategory slug or Bengali name> — the category chips.
  // Unknown values are ignored (the unfiltered index renders instead).
  const facets = await listPostCategoryFacets();
  const rawCategory = firstParam(sp.category);
  const activeFacet = rawCategory
    ? (facets.find((facet) => facet.slug === rawCategory || facet.name.bn === rawCategory) ?? null)
    : null;

  const categorySlug = topicFilter ? `clar-${topicFilter.id}` : activeFacet?.slug || undefined;
  const categoryName = !topicFilter && activeFacet && !activeFacet.slug ? activeFacet.name.bn : undefined;

  const requestedPage = Math.min(500, Math.max(1, Number.parseInt(firstParam(sp.page) ?? "1", 10) || 1));
  const result = await listPublishedPosts({
    page: requestedPage,
    pageSize: PAGE_SIZE,
    categorySlug,
    categoryName,
  });
  const safePage = Math.min(requestedPage, result.totalPages);

  const articles = result.articles.map((article) => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    author: article.author,
    authorRole: article.authorRole,
    publishedAt: article.publishedAt,
    readMinutes: article.readMinutes,
    cover: article.cover,
  }));

  /** Pagination + chip URLs keep the active filter (topic takes precedence). */
  const buildBlogUrl = (pageNumber: number) => {
    const search = new URLSearchParams();
    if (topicFilter) search.set("topic", topicFilter.id);
    else if (activeFacet) search.set("category", activeFacet.slug || activeFacet.name.bn);
    if (pageNumber > 1) search.set("page", String(pageNumber));
    const qs = search.toString();
    return langPath(lang, qs ? `/media/blog?${qs}` : "/media/blog");
  };
  const activeFilterLabel = topicFilter
    ? pick(topicFilter.title, lang)
    : activeFacet
      ? pick(activeFacet.name, lang)
      : null;

  return (
    <>
      <PageHero
        lang={lang}
        eyebrow={{ bn: "মিডিয়া", en: "Media" }}
        title={{ bn: "ব্লগ ও প্রবন্ধ", en: "Blog & Articles" }}
        description={{
          bn: "সংশয় নিরসন থেকে পদ্ধতিগত গবেষণা — ইনস্টিটিউটের উস্তাজ ও গবেষকদের লেখা প্রামাণ্য প্রবন্ধের সংগ্রহ।",
          en: "From doubt resolution to research methodology — a collection of evidenced essays by the institute's ustaz and researchers.",
        }}
        breadcrumb={[
          { label: { bn: "মিডিয়া", en: "Media" }, href: langPath(lang, "/media") },
          { label: { bn: "ব্লগ", en: "Blog" } },
        ]}
        arabicEcho="اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ"
      />

      <section className="bg-parchment py-14 sm:py-20">
        <div className="container-site">
          <Reveal className="mb-8 text-center">
            <p className="text-sm text-muted-foreground">
              {lang === "bn"
                ? `মোট ${toBnDigits(result.total)} টি গবেষণা-প্রবন্ধ${activeFilterLabel ? ` — ${activeFilterLabel}` : ""} — ক্যাটাগরি অনুযায়ী ছাঁকুন`
                : `${result.total} research ${result.total === 1 ? "essay" : "essays"}${activeFilterLabel ? ` in ${activeFilterLabel}` : ""} — filter by category`}
            </p>
          </Reveal>

          {/* ————— Category chips (server links → ?category= param) ————— */}
          {(() => {
            const allCount = facets.reduce((sum, facet) => sum + facet.count, 0);
            return (
              <Reveal delay={0.05} className="mb-8 flex flex-wrap items-center justify-center gap-2">
                <Link
                  href={langPath(lang, "/media/blog")}
                  aria-current={!activeFacet && !topicFilter ? "true" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment",
                    !activeFacet && !topicFilter
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {lang === "bn" ? "সব প্রবন্ধ" : "All articles"}
                  <span className="ml-1.5 opacity-70">{lang === "bn" ? toBnDigits(allCount) : allCount}</span>
                </Link>
                {facets.map((facet) => {
                  const isActive = !topicFilter && (activeFacet?.slug === facet.slug || activeFacet?.name.bn === facet.name.bn);
                  return (
                    <Link
                      key={facet.slug || facet.name.bn}
                      href={langPath(lang, `/media/blog?category=${encodeURIComponent(facet.slug || facet.name.bn)}`)}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "rounded-full px-4 py-2 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {pick(facet.name, lang)}
                      <span className="ml-1.5 opacity-70">{lang === "bn" ? toBnDigits(facet.count) : facet.count}</span>
                    </Link>
                  );
                })}
              </Reveal>
            );
          })()}

          {/* active topic filter chip + clear button (legacy ?topic= deep-links) */}
          {topicFilter ? (
            <Reveal delay={0.05} className="mb-8 flex flex-wrap items-center justify-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-[13px] font-semibold text-gold"
                aria-label={lang === "bn" ? "সক্রিয় ফিল্টার" : "Active filter"}
              >
                <Filter aria-hidden className="h-3.5 w-3.5" />
                {pick(topicFilter.title, lang)}
              </span>
              <Link
                href={langPath(lang, "/media/blog")}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
                {lang === "bn" ? "সব দেখুন" : "View all"}
              </Link>
            </Reveal>
          ) : null}

          <BlogExplorer articles={articles} lang={lang} />

          {/* ————— Pagination (shared component, preserves the filter) ————— */}
          <SitePagination
            page={safePage}
            totalPages={result.totalPages}
            buildUrl={buildBlogUrl}
            lang={lang}
            labels={{
              prev: lang === "bn" ? "পূর্ববর্তী পাতা" : "Previous page",
              next: lang === "bn" ? "পরবর্তী পাতা" : "Next page",
              nav: lang === "bn" ? "পেজিনেশন" : "Pagination",
              page: (pageNumber) => (lang === "bn" ? `পাতা ${toBnDigits(pageNumber)}` : `Page ${pageNumber}`),
              status: (pageNumber, totalPages) =>
                lang === "bn"
                  ? `পাতা ${toBnDigits(pageNumber)} / ${toBnDigits(totalPages)}`
                  : `Page ${pageNumber} of ${totalPages}`,
            }}
          />
        </div>
      </section>
    </>
  );
}
