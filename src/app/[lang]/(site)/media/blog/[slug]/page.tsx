import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, User } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { pick } from "@/types";
import { formatDate, toBnDigits } from "@/lib/format";
import { getArticleBySlug, getBlogArticles, getRelatedArticles } from "@/lib/content/blog";
import { alternatesFor } from "@/lib/locale";
import { env } from "@/lib/env";
import { estimateReadingMinutes, extractHeadings } from "@/lib/article";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { ArticleProse } from "@/components/media/article-prose";
import { ArticleShare } from "@/components/media/article-share";
import { ArticleToc } from "@/components/media/article-toc";
import { ReadingProgress } from "@/components/media/reading-progress";
import { GoldRule, StarMotif } from "@/components/shared/ornaments";
import { Badge } from "@/components/ui/badge";

interface ArticlePageProps {
  params: Promise<{ lang: Lang; slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const articles = await getBlogArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug, lang } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "প্রবন্ধ পাওয়া যায়নি" };
  const { canonical, languages } = alternatesFor(`/media/blog/${slug}`, env.siteUrl);
  return {
    title: lang === "bn" ? `${article.title.bn} | আস-সুন্নাহ ইনস্টিটিউট ব্লগ` : `${article.title.en} | ASDRI Blog`,
    description: lang === "bn" ? article.excerpt.bn : article.excerpt.en,
    alternates: { canonical, languages },
    openGraph: {
      title: lang === "bn" ? article.title.bn : article.title.en,
      description: lang === "bn" ? article.excerpt.bn : article.excerpt.en,
      images: [{ url: article.cover }],
      type: "article",
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug, lang } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(slug);

  // Reading time estimated from the Bengali body (~180 wpm) and the TOC
  // headings parsed from the same markdown the prose renderer consumes.
  const readingMinutes = estimateReadingMinutes(article.contentBn);
  const headings = extractHeadings(article.contentBn);
  const showToc = headings.length >= 3;

  return (
    <>
      <ReadingProgress />
      <PageHero
        lang={lang}
        eyebrow={article.category}
        title={article.title}
        description={article.excerpt}
        breadcrumb={[
          { label: { bn: "মিডিয়া", en: "Media" }, href: langPath(lang, "/media") },
          { label: { bn: "ব্লগ", en: "Blog" }, href: langPath(lang, "/media/blog") },
          { label: article.title },
        ]}
      />

      <article className="bg-parchment pb-16 pt-10 sm:pt-14">
        <div className="container-site">
          {/* ————— Cover + meta header ————— */}
          <Reveal>
            <figure className="relative overflow-hidden rounded-2xl shadow-lg">
              <img
                src={article.cover}
                alt={pick(article.title, lang)}
                className="h-64 w-full object-cover sm:h-96"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-5 gap-y-2 p-5 text-[13px] text-ivory/95 sm:p-6">
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-heading text-sm font-bold text-gold-foreground">
                    {article.author.replace(/^(ড\.|মাওলানা|উস্তায|উস্তাজ)\s*/u, "").slice(0, 2)}
                  </span>
                  <span>
                    <span className="sr-only">{lang === "bn" ? "লিখেছেন" : "By"} </span>
                    {article.author}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays aria-hidden className="h-4 w-4 text-gold" />
                  {formatDate(article.publishedAt, lang)}
                </span>
                <Badge className="gap-1.5 border-gold/40 bg-gold/15 px-3 py-1 text-xs font-semibold text-gold hover:bg-gold/25">
                  <Clock3 aria-hidden className="h-3.5 w-3.5" />
                  {toBnDigits(readingMinutes)} {lang === "bn" ? "মিনিট পড়া" : "min read"}
                </Badge>
              </figcaption>
            </figure>
          </Reveal>

          {/* ————— Mobile table of contents (above the body) ————— */}
          {showToc ? (
            <Reveal delay={0.08}>
              <div className="mt-6 lg:hidden">
                <ArticleToc headings={headings} />
              </div>
            </Reveal>
          ) : null}

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
            {/* ————— Body ————— */}
            <Reveal delay={0.05}>
              <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
                <ArticleProse content={article.contentBn} />

                <div className="mt-10 border-t pt-6">
                  <ArticleShare title={article.title} path={`/media/blog/${article.slug}`} />
                </div>
              </div>
            </Reveal>

            {/* ————— Sidebar: TOC + author card + back ————— */}
            <Reveal delay={0.12} className="lg:sticky lg:top-24 lg:self-start">
              {showToc ? (
                <div className="mb-4 hidden lg:block">
                  <ArticleToc headings={headings} />
                </div>
              ) : null}
              <div className="relative overflow-hidden rounded-2xl bg-emerald-deep p-6 text-ivory shadow-md">
                <StarMotif className="absolute -right-5 -top-5 h-24 w-24 text-gold/15" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                  {lang === "bn" ? "লেখক পরিচিতি" : "About the author"}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-gradient font-heading text-lg font-bold text-gold-foreground">
                    {article.author.replace(/^(ড\.|মাওলানা|উস্তায|উস্তাজ)\s*/u, "").slice(0, 2)}
                  </span>
                  <div>
                    <p className="font-heading text-lg font-semibold">{article.author}</p>
                    <p className="text-xs leading-relaxed text-ivory/70">{pick(article.authorRole, lang)}</p>
                  </div>
                </div>
                <p className="mt-4 border-t border-ivory/15 pt-4 text-[13px] leading-relaxed text-ivory/70">
                  {lang === "bn"
                    ? "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউটের গবেষণা দলের সদস্য হিসেবে সমকালীন চিন্তার চ্যালেঞ্জ ও প্রামাণ্য জবাব নিয়ে নিয়মিত লেখেন।"
                    : "A member of the institute's research faculty, writing regularly on contemporary intellectual challenges and evidenced responses."}
                </p>
              </div>

              <Link
                href={langPath(lang, "/media/blog")}
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl border bg-card px-5 py-3.5 text-sm font-semibold text-primary shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
              >
                <ArrowLeft aria-hidden className="h-4 w-4" />
                {lang === "bn" ? "সব প্রবন্ধে ফিরে যান" : "Back to all articles"}
              </Link>
            </Reveal>
          </div>

          {/* ————— Related articles ————— */}
          {related.length > 0 ? (
            <section className="mt-16" aria-labelledby="related-heading">
              <Reveal>
                <div className="mb-8 flex items-center gap-3">
                  <span aria-hidden className="h-px flex-1 bg-gold/40" />
                  <h2 id="related-heading" className="font-heading text-xl font-semibold sm:text-2xl">
                    {lang === "bn" ? "সম্পর্কিত প্রবন্ধ" : "Related articles"}
                  </h2>
                  <span aria-hidden className="h-px flex-1 bg-gold/40" />
                </div>
              </Reveal>
              <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <RevealItem key={item.slug}>
                    <Link
                      href={langPath(lang, `/media/blog/${item.slug}`)}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-md"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img
                          src={item.cover}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
                          {pick(item.category, lang)}
                        </p>
                        <h3 className="font-heading text-base font-semibold leading-snug transition-colors group-hover:text-primary">
                          {pick(item.title, lang)}
                        </h3>
                        <div className="mt-auto flex items-center justify-between pt-3 text-[12px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <User aria-hidden className="h-3 w-3 text-gold" />
                            {item.author}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 aria-hidden className="h-3.5 w-3.5 text-gold" />
                            {toBnDigits(item.readMinutes)} {lang === "bn" ? "মিনিট" : "min"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </RevealItem>
                ))}
              </Stagger>
              <Reveal className="mt-10 flex justify-center">
                <Link
                  href={langPath(lang, "/media/blog")}
                  className="link-sweep inline-flex items-center gap-2 text-sm font-semibold text-primary"
                >
                  {lang === "bn" ? "সব প্রবন্ধ দেখুন" : "View all articles"}
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </Reveal>
            </section>
          ) : null}

          <GoldRule className="mt-16" />
        </div>
      </article>
    </>
  );
}
