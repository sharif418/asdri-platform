import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CalendarDays, Download, FileText, Landmark, Pin } from "lucide-react";
import type { Lang } from "@/lib/locale";
import { langPath, alternatesFor } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { getSiteConfig } from "@/lib/content/site";
import { getNoticeBySlug, getNoticeNeighbors } from "@/lib/content/notices";
import { env } from "@/lib/env";
import { pick } from "@/types";
import { formatDate } from "@/lib/format";
import { sanitizeRichText } from "@/lib/sanitize";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { PageHero } from "@/components/shared/page-hero";
import { PrintButton } from "@/components/shared/print-button";
import { ArticleShare } from "@/components/media/article-share";
import { categoryLabel, statusBadgeClass, statusLabel } from "@/lib/notice-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Public notice detail page — every notice gets a real, shareable URL
 * (crawlable HTML + OG article card for WhatsApp/Facebook previews, which
 * is how notices actually travel in Bangladesh) with the same "official
 * pad" presentation as the board dialog: gold-edged parchment, print-ready
 * masthead, attachment download. The board keeps its quick-view dialog;
 * this page is the permalink the office can print, pin, and forward.
 */

interface NoticePageProps {
  params: Promise<{ lang: Lang; slug: string }>;
}

export async function generateMetadata({ params }: NoticePageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const [notice, siteConfig] = await Promise.all([getNoticeBySlug(slug), getSiteConfig()]);
  if (!notice) return { title: lang === "bn" ? "বিজ্ঞপ্তি পাওয়া যায়নি" : "Notice not found" };
  const { canonical, languages } = alternatesFor(`/notices/${slug}`, env.siteUrl);
  const description =
    pick(notice.excerpt, lang).trim() ||
    (pick(notice.body, lang).replace(/<[^>]*>/g, " ").trim().slice(0, 155) || undefined);
  const title = pick(notice.title, lang);
  return {
    title: lang === "bn" ? `${title} — ${siteConfig.shortBn}` : `${title} — Notices`,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: notice.publishedAt,
      modifiedTime: notice.updatedAt,
      section: categoryLabel(notice.category, lang),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function NoticeDetailPage({ params }: NoticePageProps) {
  const { lang, slug } = await params;
  if (!(await isFeatureEnabled("notices"))) {
    return <ModuleUnavailable lang={lang} moduleLabelBn="নোটিশ বোর্ড" moduleLabelEn="Notice board" />;
  }

  const notice = await getNoticeBySlug(slug);
  if (!notice) notFound();

  const [{ prev, next }, siteConfig] = await Promise.all([getNoticeNeighbors(notice.publishedAt), getSiteConfig()]);
  const bn = lang === "bn";

  const bodyHtml = sanitizeRichText(pick(notice.body, lang));
  const excerptText = pick(notice.excerpt, lang).trim();

  // Structured data for search engines (article card + publisher).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: pick(notice.title, lang),
    description: excerptText || undefined,
    datePublished: notice.publishedAt,
    dateModified: notice.updatedAt,
    inLanguage: bn ? "bn" : "en",
    publisher: { "@type": "Organization", name: bn ? siteConfig.nameBn : siteConfig.nameEn },
    mainEntityOfPage: `${env.siteUrl}${langPath(lang, `/notices/${notice.slug}`)}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Own-template JSON — no user-controlled strings are interpolated raw
        // (headline/excerpt come from sanitized DB rows, quotes escaped by JSON.stringify).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        lang={lang}
        eyebrow={bn ? "দাপ্তরিক বিজ্ঞপ্তি" : "Official Notice"}
        title={notice.title}
        description={excerptText || undefined}
        breadcrumb={[
          { label: { bn: "নোটিশ বোর্ড", en: "Notices" }, href: langPath(lang, "/notices") },
          { label: notice.title },
        ]}
        meta={{
          textBn: `প্রকাশ: ${formatDate(notice.publishedAt, "bn")}`,
          textEn: `Published: ${formatDate(notice.publishedAt, "en")}`,
        }}
      />

      <section className="bg-parchment pb-16 pt-8 sm:pb-20 sm:pt-12">
        <div className="container-site">
          {/* ————— Action bar: share • attachment • official print ————— */}
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold/20 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 print:hidden">
            <ArticleShare title={notice.title} path={`/notices/${notice.slug}`} />
            <div className="flex flex-wrap items-center gap-2">
              {notice.attachmentUrl ? (
                <Button asChild variant="outline" className="gap-2 border-gold/40 font-semibold hover:bg-gold-soft">
                  <a href={notice.attachmentUrl} download>
                    <Download aria-hidden className="h-4 w-4" />
                    {bn ? "সংযুক্ত ফাইল" : "Attachment"}
                  </a>
                </Button>
              ) : null}
              <PrintButton
                bodyClass="printing-notice"
                label={bn ? "অফিসিয়াল কপি (PDF)" : "Official copy (PDF)"}
              />
            </div>
          </div>

          {/* ————— The official pad ————— */}
          <article className="print-zone relative overflow-hidden rounded-2xl border border-gold/25 bg-card shadow-sm">
            <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />

            {/* print-only official masthead */}
            <header className="hidden print:mb-5 print:block print:border-b-2 print:border-black print:pb-3 print:text-center">
              <p className="font-heading text-lg font-bold print:text-black">
                {bn ? "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট" : "As-Sunnah Dawah & Research Institute"}
              </p>
              <p className="mt-1 text-sm print:text-black">
                {bn ? "দাপ্তরিক বিজ্ঞপ্তি" : "Official Notice"} — {categoryLabel(notice.category, lang)}
              </p>
            </header>

            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 print:justify-center">
                {notice.pinned ? (
                  <Badge variant="outline" className="gap-1 border-gold/40 bg-gold/15 text-[11px] font-semibold text-gold">
                    <Pin aria-hidden className="h-3 w-3" />
                    {bn ? "পিন করা" : "Pinned"}
                  </Badge>
                ) : null}
                <Badge variant="outline" className={cn("text-[11px] font-semibold", statusBadgeClass(notice.status))}>
                  {statusLabel(notice.status, lang)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/5 text-[11px] font-semibold text-primary dark:text-gold"
                >
                  <FileText aria-hidden className="mr-1 h-3 w-3" />
                  {categoryLabel(notice.category, lang)}
                </Badge>
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums print:ml-0">
                  <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
                  {bn ? "প্রকাশ: " : "Published: "}
                  {formatDate(notice.publishedAt, lang)}
                </span>
              </div>

              <h1 className="sr-only">{pick(notice.title, lang)}</h1>

              <div className="prose-islamic mt-5 text-[15px] leading-[1.9] sm:text-base">
                {bodyHtml ? (
                  // Stored rich HTML — written through the admin editor's strict
                  // whitelist (sanitizeRichText on save) and re-sanitised here on
                  // read, so only semantic tags can ever reach the DOM.
                  <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                ) : (
                  <p className="font-medium text-foreground">{excerptText}</p>
                )}
              </div>

              {!notice.attachmentUrl ? (
                <p className="mt-6 rounded-xl border border-dashed border-gold/30 bg-gold/5 px-4 py-3 text-xs text-muted-foreground print:hidden">
                  {bn
                    ? "এই বিজ্ঞপ্তির কোনো সংযুক্ত ফাইল নেই। বিস্তারিত জানতে অফিসে যোগাযোগ করুন।"
                    : "No attachment for this notice. Contact the office for details."}
                </p>
              ) : null}
            </div>

            {/* print-only reference footer */}
            <p className="hidden print:mt-4 print:flex print:justify-between print:text-xs print:text-black">
              <span>Ref: {notice.slug}</span>
              <span>
                {bn ? "ইস্যু" : "Issued"}: {formatDate(notice.publishedAt, lang)}
              </span>
            </p>
          </article>

          {/* ————— Back to the board ————— */}
          <div className="mt-6 print:hidden">
            <Link
              href={langPath(lang, "/notices")}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold dark:text-gold"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              {bn ? "নোটিশ বোর্ডে ফিরে যান" : "Back to the notice board"}
            </Link>
          </div>

          {/* ————— Chronological neighbours ————— */}
          {(prev || next) && (
            <nav aria-label={bn ? "নোটিশ নেভিগেশন" : "Notice navigation"} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 print:hidden">
              {prev ? (
                <Link
                  href={langPath(lang, `/notices/${prev.slug}`)}
                  className="group flex min-w-0 items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  <ArrowLeft
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-gold"
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {bn ? "পূর্ববর্তী নোটিশ" : "Previous notice"}
                    </span>
                    <span className="mt-1 block truncate font-heading text-sm font-semibold leading-snug">
                      {pick(prev.title, lang)}
                    </span>
                  </span>
                </Link>
              ) : (
                <span aria-hidden className="hidden sm:block" />
              )}
              {next ? (
                <Link
                  href={langPath(lang, `/notices/${next.slug}`)}
                  className="group flex min-w-0 flex-row-reverse items-start gap-3 rounded-2xl border bg-card p-4 text-right shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  <ArrowRight
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-gold"
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {bn ? "পরবর্তী নোটিশ" : "Next notice"}
                    </span>
                    <span className="mt-1 block truncate font-heading text-sm font-semibold leading-snug">
                      {pick(next.title, lang)}
                    </span>
                  </span>
                </Link>
              ) : null}
            </nav>
          )}

          {/* ————— Office contact reminder ————— */}
          <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground print:hidden">
            <Landmark aria-hidden className="h-3.5 w-3.5 text-gold" />
            {bn
              ? "এই বিজ্ঞপ্তি সম্পর্কে জিজ্ঞাসা? অফিস চলাকালীন সরাসরি যোগাযোগ করুন।"
              : "Questions about this notice? Contact the office during office hours."}
          </p>
        </div>
      </section>
    </>
  );
}
