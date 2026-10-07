import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookMarked,
  BookOpenText,
  Building2,
  CalendarDays,
  Download,
  ExternalLink,
  Fingerprint,
  Languages,
  LibraryBig,
  Lock,
  MapPin,
  Quote,
  UserRound,
} from "lucide-react";
import { alternatesFor, langPath, type Lang } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { env } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { formatNumber, toBnDigits } from "@/lib/format";
import { sanitizeRichText } from "@/lib/sanitize";
import { pick } from "@/types";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { GoldRule } from "@/components/shared/ornaments";
import { BrandMonoMark } from "@/components/shared/logo";
import { CitationGenerator } from "@/components/research/citation-generator";
import { LibraryRecordAside } from "@/components/library/library-record-aside";
import {
  LIBRARY_MEMBERS_LABEL,
  LIBRARY_ROLE_LABELS,
  LIBRARY_TYPE_LABELS,
  libraryCreatorFullLine,
  libraryReaderHref,
  libraryLanguageLabel,
} from "@/components/library/library-shared";
import {
  getLibraryItemBySlug,
  type LibraryItemDetail,
} from "@/lib/content/library";
import {
  getRelatedLibraryItems,
  recordLibraryReading,
} from "@/lib/content/library-shelves";
import { getSiteConfig } from "@/lib/content/site";

/**
 * Record page — every catalogue item's shareable home: gold-framed cover,
 * the shared APA/Chicago/MLA citation generator, the identifiers table,
 * sanitized description, creators with roles, and an actions card whose
 * "পড়া শুরু করুন" opens the in-browser reader. MEMBERS items show the
 * badge + a login CTA to anonymous visitors instead of the file actions.
 * A LibraryReading row is recorded per view (server side, never fatal).
 */

export const dynamic = "force-dynamic"; // reading counter + session-aware actions

interface RecordPageProps {
  params: Promise<{ lang: Lang; slug: string }>;
}

function jsonLdType(type: LibraryItemDetail["type"]): string {
  switch (type) {
    case "PAPER":
      return "ScholarlyArticle";
    case "JOURNAL_ISSUE":
      return "PublicationIssue";
    case "DIGITAL_FILE":
      return "DigitalDocument";
    default:
      return "Book";
  }
}

export async function generateMetadata({
  params,
}: RecordPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const [item, siteConfig] = await Promise.all([
    getLibraryItemBySlug(slug),
    getSiteConfig(),
  ]);
  if (!item)
    return {
      title: lang === "bn" ? "আইটেমটি পাওয়া যায়নি" : "Item not found",
    };
  const title = pick(item.title, lang);
  const description =
    pick(item.description, lang)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155) ||
    (lang === "bn"
      ? "লাইব্রেরি ক্যাটালগের আইটেম।"
      : "An item from the library catalogue.");
  const { canonical, languages } = alternatesFor(
    `/research/library/${slug}`,
    env.siteUrl,
  );
  return {
    title:
      lang === "bn" ? `${title} — ${siteConfig.shortBn}` : `${title} — Library`,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: item.year != null ? `${item.year}` : undefined,
      modifiedTime: item.updatedAt.toISOString(),
      section: item.category ? pick(item.category.name, lang) : undefined,
      images: [
        {
          url: brand.og.image,
          width: brand.og.width,
          height: brand.og.height,
          alt: brand.nameEn,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [brand.og.image],
    },
  };
}

/** Identifiers table rows (skipping empty ones). */
function identifierRows(item: LibraryItemDetail) {
  return (
    [
      { key: "isbn", label: "ISBN", value: item.isbn },
      { key: "issn", label: "ISSN", value: item.issn },
      { key: "doi", label: "DOI", value: item.doi },
      {
        key: "edition",
        label: { bn: "সংস্করণ", en: "Edition" },
        value: item.editionBn,
      },
      {
        key: "volume",
        label: { bn: "খণ্ড", en: "Volume" },
        value: item.journal?.volume || null,
      },
      {
        key: "issue",
        label: { bn: "সংখ্যা", en: "Issue" },
        value: item.journal?.issueLabel || null,
      },
      {
        key: "publisher",
        label: { bn: "প্রকাশক", en: "Publisher" },
        value: item.publisher ? pick(item.publisher.name, "bn") : null,
      },
      {
        key: "place",
        label: { bn: "প্রকাশস্থান", en: "Place" },
        value: item.publishPlaceBn || null,
      },
      {
        key: "year",
        label: { bn: "সাল", en: "Year" },
        value: item.year != null ? String(item.year) : null,
      },
    ] as const
  ).filter((row) => !!row.value);
}

export default async function LibraryRecordPage({ params }: RecordPageProps) {
  const { lang, slug } = await params;
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
  const item = await getLibraryItemBySlug(slug);
  if (!item) notFound();

  const [siteConfig, related, session] = await Promise.all([
    getSiteConfig(),
    item.category
      ? getRelatedLibraryItems(item.category.slug, item.id, 3)
      : Promise.resolve([]),
    getSession(),
  ]);

  // read counter — one row per view; a counter failure must never break the page
  await recordLibraryReading(item.id);

  const gated = item.visibility === "MEMBERS";
  const canReadFile = !gated || !!session;
  const title = pick(item.title, lang);
  const creatorLine = libraryCreatorFullLine(item.creators, lang);
  const descriptionHtml = sanitizeRichText(pick(item.description, lang));
  const rows = identifierRows(item);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": jsonLdType(item.type),
    name: title,
    headline: title,
    ...(pick(item.subtitle, lang)
      ? { alternativeHeadline: pick(item.subtitle, lang) }
      : {}),
    author: item.creators.length
      ? item.creators.map((creator) => ({
          "@type": "Person",
          name: pick(creator.name, lang),
        }))
      : {
          "@type": "Organization",
          name: bn ? siteConfig.nameBn : siteConfig.nameEn,
        },
    publisher: {
      "@type": "Organization",
      name: item.publisher
        ? pick(item.publisher.name, lang)
        : bn
          ? siteConfig.nameBn
          : siteConfig.nameEn,
    },
    ...(item.year != null ? { datePublished: `${item.year}` } : {}),
    dateModified: item.updatedAt.toISOString(),
    inLanguage: item.language === "mixed" ? "bn" : item.language,
    isAccessibleForFree: !gated,
    ...(item.isbn || item.issn || item.doi
      ? {
          identifier: [
            item.isbn
              ? { "@type": "PropertyValue", name: "ISBN", value: item.isbn }
              : null,
            item.issn
              ? { "@type": "PropertyValue", name: "ISSN", value: item.issn }
              : null,
            item.doi
              ? { "@type": "PropertyValue", name: "DOI", value: item.doi }
              : null,
          ].filter(Boolean),
        }
      : {}),
    ...(item.journal
      ? {
          isPartOf: {
            "@type": "Periodical",
            name: pick(item.journal.name, lang),
            ...(item.journal.volume
              ? { volumeNumber: item.journal.volume }
              : {}),
            ...(item.journal.issueLabel
              ? { issueNumber: item.journal.issueLabel }
              : {}),
          },
        }
      : {}),
    url: `${env.siteUrl}${langPath(lang, `/research/library/${item.slug}`)}`,
    mainEntityOfPage: `${env.siteUrl}${langPath(lang, `/research/library/${item.slug}`)}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Own-template JSON — values come from sanitized DB rows, escaped by JSON.stringify
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow={bn ? "লাইব্রেরি ক্যাটালগ" : "Library Catalogue"}
        title={title}
        description={pick(item.subtitle, lang) || undefined}
        lang={lang}
        section="research"
        breadcrumb={[
          {
            label: bn ? "গবেষণা" : "Research",
            href: langPath(lang, "/research"),
          },
          {
            label: bn ? "লাইব্রেরি ও জার্নাল" : "Library & Journals",
            href: langPath(lang, "/research/library"),
          },
          { label: title },
        ]}
        meta={{
          textBn: `${LIBRARY_TYPE_LABELS[item.type].bn}${item.year != null ? ` · ${toBnDigits(item.year)}` : ""}`,
          textEn: `${LIBRARY_TYPE_LABELS[item.type].en}${item.year != null ? ` · ${item.year}` : ""}`,
        }}
      />

      <section className="bg-parchment/60 py-10 sm:py-14 dark:bg-secondary/30">
        <div className="container-site">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* ————— left: cover, citation, identifiers, description, creators ————— */}
            <div className="min-w-0">
              {/* gold-framed cover */}
              <Reveal>
                <div className="mx-auto max-w-xs sm:max-w-sm">
                  <div className="relative rounded-lg border-2 border-gold/70 bg-card p-2 shadow-md">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-1 rounded border border-gold/30"
                    />
                    <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded bg-parchment dark:bg-secondary/50">
                      {item.coverUrl ? (
                        <img
                          src={item.coverUrl}
                          alt={bn ? `${title} — প্রচ্ছদ` : `${title} — cover`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="relative flex flex-col items-center gap-3 px-6 py-10 text-center">
                          <BrandMonoMark
                            tone="emerald"
                            className="h-16 opacity-20"
                          />
                          <span className="font-heading text-sm font-semibold leading-relaxed text-foreground/70">
                            {title}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                            {bn
                              ? "আস-সুন্নাহ ইনস্টিটিউট"
                              : "As-Sunnah Institute"}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  {gated ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-[11.5px] font-bold text-gold-foreground">
                      <Lock aria-hidden className="h-3.5 w-3.5" />
                      {pick(LIBRARY_MEMBERS_LABEL, lang)}
                    </p>
                  ) : null}
                </div>
              </Reveal>

              {/* citation generator (shared with the journal cards) */}
              <Reveal className="mt-8">
                <CitationGenerator
                  title={item.title}
                  author={
                    creatorLine || (bn ? siteConfig.nameBn : siteConfig.nameEn)
                  }
                  year={item.year}
                  lang={lang}
                  publisher={
                    item.publisher ? pick(item.publisher.name, lang) : null
                  }
                  place={item.publishPlaceBn || null}
                  edition={item.editionBn || null}
                  journal={
                    item.journal
                      ? {
                          name: pick(item.journal.name, lang),
                          volume: item.journal.volume,
                          issue: item.journal.issueLabel,
                        }
                      : null
                  }
                />
              </Reveal>

              {/* identifiers */}
              {rows.length > 0 ? (
                <Reveal className="mt-8">
                  <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                    <Fingerprint aria-hidden className="h-4 w-4 text-gold" />
                    {bn ? "শনাক্তকারী তথ্য" : "Identifiers"}
                  </h2>
                  <dl className="mt-4 grid gap-0 overflow-hidden rounded-xl border bg-card shadow-sm sm:grid-cols-2">
                    {rows.map((row) => (
                      <div
                        key={row.key}
                        className="flex items-baseline justify-between gap-4 border-b px-4 py-3 last:border-b-0 sm:odd:border-r"
                      >
                        <dt className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
                          {typeof row.label === "string"
                            ? row.label
                            : pick(row.label, lang)}
                        </dt>
                        <dd
                          className="text-right text-[13px] font-medium tabular-nums"
                          dir="auto"
                        >
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              ) : null}

              {/* description */}
              {descriptionHtml ? (
                <Reveal className="mt-8">
                  <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                    <Quote aria-hidden className="h-4 w-4 text-gold" />
                    {bn ? "বিবরণ" : "Description"}
                  </h2>
                  <div
                    className="prose-islamic mt-4"
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  />
                </Reveal>
              ) : null}

              {/* creators with roles */}
              {item.creators.length > 0 ? (
                <Reveal className="mt-8">
                  <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                    <UserRound aria-hidden className="h-4 w-4 text-gold" />
                    {bn ? "স্রষ্টাবৃন্দ" : "Creators"}
                  </h2>
                  <ul className="mt-4 flex flex-wrap gap-2.5">
                    {item.creators.map((creator, index) => (
                      <li
                        key={`${creator.name.bn}-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-[13px] shadow-sm"
                      >
                        <span className="font-semibold" dir="auto">
                          {pick(creator.name, lang)}
                        </span>
                        <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-gold-foreground">
                          {pick(LIBRARY_ROLE_LABELS[creator.role], lang)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ) : null}
            </div>

            {/* ————— right: actions, publication metadata, related ————— */}
            <LibraryRecordAside
              lang={lang}
              item={item}
              related={related}
              canReadFile={canReadFile}
            />
          </div>

          <GoldRule className="mt-14" />
          <div className="mt-8 text-center">
            <Link
              href={langPath(lang, "/research/library")}
              className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-6 py-2.5 text-[13px] font-semibold text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
            >
              {bn ? "ক্যাটালগে ফিরে যান" : "Back to the catalogue"}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
