import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, User, Clock3 } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { pick } from "@/types";
import { toBnDigits } from "@/lib/format";
import { getArticleBySlug, getRelatedArticles } from "@/lib/content/blog";
import { alternatesFor } from "@/lib/locale";
import { env } from "@/lib/env";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { PostArticleView } from "@/components/media/post-article-view";
import { ReadingProgress } from "@/components/media/reading-progress";
import { GoldRule } from "@/components/shared/ornaments";

interface ArticlePageProps {
  params: Promise<{ lang: Lang; slug: string }>;
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
          {/* The shared article render — the signed /preview route reuses it. */}
          <PostArticleView
            article={article}
            lang={lang}
            sharePath={`/media/blog/${article.slug}`}
            backHref={langPath(lang, "/media/blog")}
          />

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
                            {lang === "bn" ? toBnDigits(item.readMinutes) : item.readMinutes} {lang === "bn" ? "মিনিট" : "min"}
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
