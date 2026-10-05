import type { Metadata } from "next";
import Link from "next/link";
import { langPath, type Lang } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { getBlogArticles } from "@/lib/content/blog";
import { alternatesFor } from "@/lib/locale";
import { env } from "@/lib/env";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { BlogExplorer } from "@/components/media/blog-explorer";
import { toBnDigits } from "@/lib/format";
import { pick, type LocalizedText } from "@/types";
import { cn } from "@/lib/utils";

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

interface BlogIndexPageProps {
  params: Promise<{ lang: Lang }>;
  searchParams: Promise<{ topic?: string | string[] }>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Topic chip href — preserves the সংশয় নিরসন filter (`?topic=clar-*`). */
function buildTopicHref(lang: Lang, topic: string | null): string {
  const path = topic ? `/media/blog?topic=${encodeURIComponent(topic)}` : "/media/blog";
  return langPath(lang, path);
}

/** One represented topic chip: key (`clar-*`), label, article count. */
interface TopicChip {
  key: string;
  label: LocalizedText;
  count: number;
}

export default async function BlogIndexPage({ params, searchParams }: BlogIndexPageProps) {
  const { lang } = await params;
  if (!(await isFeatureEnabled("blog"))) {
    return <ModuleUnavailable lang={lang} moduleLabelBn="ব্লগ ও প্রবন্ধ" moduleLabelEn="Blog & essays" />;
  }

  const blogArticles = await getBlogArticles();

  // সংশয় নিরসন topics represented among the articles (clar- categories).
  const topics: TopicChip[] = [];
  for (const article of blogArticles) {
    if (!article.topicKey) continue;
    const existing = topics.find((topic) => topic.key === article.topicKey);
    if (existing) existing.count += 1;
    else topics.push({ key: article.topicKey, label: article.category, count: 1 });
  }

  // Filter server-side by ?topic= (unknown topic values fall back to all).
  const topicParam = firstParam((await searchParams).topic);
  const activeTopic = topics.find((topic) => topic.key === topicParam)?.key ?? null;
  const visibleArticles = activeTopic
    ? blogArticles.filter((article) => article.topicKey === activeTopic)
    : blogArticles;

  const articles = visibleArticles.map((article) => ({
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
                ? `মোট ${toBnDigits(articles.length)} টি গবেষণা-প্রবন্ধ${activeTopic ? " — নির্বাচিত বিষয়ে" : ""}`
                : `${articles.length} research essays${activeTopic ? " — filtered topic" : ""}`}
            </p>
          </Reveal>

          {topics.length > 1 ? (
            <Reveal delay={0.05} className="mb-10">
              <nav
                aria-label={lang === "bn" ? "বিষয় ফিল্টার" : "Topic filter"}
                className="flex flex-wrap items-center justify-center gap-2"
              >
                <Link
                  href={buildTopicHref(lang, null)}
                  aria-current={activeTopic ? undefined : "page"}
                  className={cn(
                    "rounded-full px-4 py-2 text-[13px] font-medium transition-all",
                    !activeTopic
                      ? "bg-gold-gradient text-gold-foreground shadow-md"
                      : "border bg-card text-muted-foreground hover:border-gold/50 hover:text-foreground",
                  )}
                >
                  {lang === "bn" ? "সব" : "All"}
                  <span className="ml-1.5 opacity-70">{toBnDigits(blogArticles.length)}</span>
                </Link>
                {topics.map((topic) => {
                  const active = activeTopic === topic.key;
                  return (
                    <Link
                      key={topic.key}
                      href={buildTopicHref(lang, topic.key)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-full px-4 py-2 text-[13px] font-medium transition-all",
                        active
                          ? "bg-gold-gradient text-gold-foreground shadow-md"
                          : "border bg-card text-muted-foreground hover:border-gold/50 hover:text-foreground",
                      )}
                    >
                      {pick(topic.label, lang)}
                      <span className="ml-1.5 opacity-70">{toBnDigits(topic.count)}</span>
                    </Link>
                  );
                })}
              </nav>
            </Reveal>
          ) : null}

          <BlogExplorer articles={articles} lang={lang} />
        </div>
      </section>
    </>
  );
}
