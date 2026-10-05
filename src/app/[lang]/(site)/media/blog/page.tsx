import type { Metadata } from "next";
import Link from "next/link";
import { Filter, X } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { getArticlesByCategorySlug, getBlogArticles } from "@/lib/content/blog";
import { getClarificationTopics } from "@/lib/content/research";
import { alternatesFor } from "@/lib/locale";
import { env } from "@/lib/env";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { BlogExplorer } from "@/components/media/blog-explorer";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";

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

  // ?topic=<clarification topic id> — deep-link filter from the clarifications
  // page. Unknown ids are ignored (the unfiltered index renders instead).
  const sp = await searchParams;
  const rawTopic = Array.isArray(sp.topic) ? sp.topic[0] : sp.topic;
  let topicFilter: { id: string; name: { bn: string; en: string } } | null = null;
  if (rawTopic) {
    const match = (await getClarificationTopics()).find((topic) => topic.id === rawTopic);
    if (match) topicFilter = { id: match.id, name: match.title };
  }

  const blogArticles = topicFilter
    ? await getArticlesByCategorySlug(`clar-${topicFilter.id}`)
    : await getBlogArticles();
  const articles = blogArticles.map((article) => ({
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
                ? `মোট ${toBnDigits(blogArticles.length)} টি গবেষণা-প্রবন্ধ${topicFilter ? ` — ${pick(topicFilter.name, lang)}` : ""} — ক্যাটাগরি অনুযায়ী ছাঁকুন`
                : `${blogArticles.length} research essays${topicFilter ? ` in ${pick(topicFilter.name, lang)}` : ""} — filter by category`}
            </p>
          </Reveal>

          {/* active topic filter chip + clear button */}
          {topicFilter ? (
            <Reveal delay={0.05} className="mb-8 flex flex-wrap items-center justify-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-[13px] font-semibold text-gold"
                aria-label={lang === "bn" ? "সক্রিয় ফিল্টার" : "Active filter"}
              >
                <Filter aria-hidden className="h-3.5 w-3.5" />
                {pick(topicFilter.name, lang)}
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
        </div>
      </section>
    </>
  );
}
