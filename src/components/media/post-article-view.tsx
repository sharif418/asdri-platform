import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react";
import type { Lang } from "@/lib/locale";
import { langPath } from "@/lib/locale";
import type { BlogArticle } from "@/types";
import { pick } from "@/types";
import { formatDate, toBnDigits } from "@/lib/format";
import { estimateReadingMinutes, extractHeadings } from "@/lib/article";
import { Reveal } from "@/components/shared/reveal";
import { ArticleProse } from "@/components/media/article-prose";
import { ArticleShare } from "@/components/media/article-share";
import { ArticleToc } from "@/components/media/article-toc";
import { StarMotif } from "@/components/shared/ornaments";
import { Badge } from "@/components/ui/badge";

/**
 * The article render — cover figure, table of contents, the prose card and
 * the author sidebar. The public permalink page renders published articles
 * through it; the signed /preview route renders drafts through the same
 * component so a preview is pixel-identical to the published page.
 *
 * `sharePath`/`backHref` are the only page-specific parts: previews pass null
 * (nothing to share or go back to until the piece is published).
 */
export function PostArticleView({
  article,
  lang,
  sharePath,
  backHref,
}: {
  article: BlogArticle;
  lang: Lang;
  sharePath: string | null;
  backHref: string | null;
}) {
  const bn = lang === "bn";
  // Reading time estimated from the Bengali body (~180 wpm) and the TOC
  // headings parsed from the same markdown the prose renderer consumes.
  const readingMinutes = estimateReadingMinutes(article.contentBn);
  const headings = extractHeadings(article.contentBn);
  const showToc = headings.length >= 3;

  return (
    <>
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
                <span className="sr-only">{bn ? "লিখেছেন" : "By"} </span>
                {article.author}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden className="h-4 w-4 text-gold" />
              {formatDate(article.publishedAt, lang)}
            </span>
            <Badge className="gap-1.5 border-gold/40 bg-gold/15 px-3 py-1 text-xs font-semibold text-gold hover:bg-gold/25">
              <Clock3 aria-hidden className="h-3.5 w-3.5" />
              {bn ? toBnDigits(readingMinutes) : readingMinutes} {bn ? "মিনিট পড়া" : "min read"}
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

            {sharePath ? (
              <div className="mt-10 border-t pt-6">
                <ArticleShare title={article.title} path={sharePath} />
              </div>
            ) : null}
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
              {bn ? "লেখক পরিচিতি" : "About the author"}
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
              {bn
                ? "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউটের গবেষণা দলের সদস্য হিসেবে সমকালীন চিন্তার চ্যালেঞ্জ ও প্রামাণ্য জবাব নিয়ে নিয়মিত লেখেন।"
                : "A member of the institute's research faculty, writing regularly on contemporary intellectual challenges and evidenced responses."}
            </p>
          </div>

          {backHref ? (
            <Link
              href={backHref}
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl border bg-card px-5 py-3.5 text-sm font-semibold text-primary shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              {bn ? "সব প্রবন্ধে ফিরে যান" : "Back to all articles"}
            </Link>
          ) : null}
        </Reveal>
      </div>
    </>
  );
}
