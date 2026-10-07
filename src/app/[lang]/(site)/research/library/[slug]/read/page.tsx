import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Download,
  ExternalLink,
  FileWarning,
  Lock,
} from "lucide-react";
import { alternatesFor, langPath, type Lang } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { env } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { pick } from "@/types";
import { PageHero } from "@/components/shared/page-hero";
import { PdfReader } from "@/components/library/reader/pdf-reader";
import { getLibraryItemBySlug } from "@/lib/content/library";
import { libraryItemHref } from "@/components/library/library-shared";

/**
 * The in-browser reader route. Server-side guards, in order:
 *   1. the item must exist and be published (unknown slug → 404);
 *   2. MEMBERS visibility needs any logged-in account — anonymous visitors
 *      get an inline notice with the sign-in link (never a bare redirect,
 *      so the URL they opened stays explainable);
 *   3. no attached PDF → a friendly note with the download/external links.
 * Only then does the pdfjs client island load.
 */

interface ReaderPageProps {
  params: Promise<{ lang: Lang; slug: string }>;
}

export async function generateMetadata({
  params,
}: ReaderPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const item = await getLibraryItemBySlug(slug);
  const title = item
    ? pick(item.title, lang)
    : lang === "bn"
      ? "রিডার"
      : "Reader";
  const { canonical, languages } = alternatesFor(
    `/research/library/${slug}/read`,
    env.siteUrl,
  );
  return {
    title: lang === "bn" ? `${title} — পাঠ` : `${title} — Reader`,
    description:
      lang === "bn"
        ? "ব্রাউজারেই পিডিএফ পড়ুন — পৃষ্ঠা নেভিগেশন, জুম, ডকুমেন্টের ভেতরে অনুসন্ধান ও কীবোর্ড শর্টকাটসহ।"
        : "Read the PDF in the browser — page navigation, zoom, in-document search, and keyboard shortcuts.",
    alternates: { canonical, languages },
    robots: { index: false, follow: true }, // a reading surface, not a content page
  };
}

export default async function LibraryReaderPage({ params }: ReaderPageProps) {
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

  const title = pick(item.title, lang);

  // ——— MEMBERS gate: any signed-in account passes ———
  if (item.visibility === "MEMBERS") {
    const session = await getSession();
    if (!session) {
      return (
        <>
          <PageHero
            eyebrow={bn ? "লাইব্রেরি ক্যাটালগ" : "Library Catalogue"}
            title={bn ? "সদস্যদের জন্য সংরক্ষিত" : "Reserved for members"}
            description={
              bn
                ? `"${title}" — এই আইটেমের পিডিএফ ও রিডার খোলার জন্য একটি অ্যাকাউন্ট প্রয়োজন।`
                : `"${title}" — reading this item's PDF requires an account.`
            }
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
              { label: title, href: libraryItemHref(lang, item.slug) },
              { label: bn ? "রিডার" : "Reader" },
            ]}
          />
          <section className="bg-parchment/60 py-14 dark:bg-secondary/30">
            <div className="container-site">
              <div className="mx-auto max-w-lg rounded-2xl border border-gold/40 bg-card p-8 text-center shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                  <Lock aria-hidden className="h-7 w-7" />
                </span>
                <h2 className="font-heading mt-4 text-lg font-semibold">
                  {bn ? "লগইন করে পড়া শুরু করুন" : "Sign in to start reading"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {bn
                    ? "যেকোনো নিবন্ধিত অ্যাকাউন্ট (শিক্ষার্থী, ডোনার বা কর্মী) দিয়ে লগইন করলেই এই আইটেমের রিডার খুলে যাবে।"
                    : "Any registered account — student, donor, or staff — unlocks this item's reader."}
                </p>
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                  <Link
                    href={langPath(lang, "/login")}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {bn ? "লগইন করুন" : "Sign in"}
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </Link>
                  <Link
                    href={libraryItemHref(lang, item.slug)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/50 px-6 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
                  >
                    {bn ? "রেকর্ড পাতায় ফিরুন" : "Back to the record"}
                  </Link>
                </div>
                <p className="mt-4 text-[12px] text-muted-foreground">
                  {bn ? "অ্যাকাউন্ট নেই? " : "No account? "}
                  <Link
                    href={langPath(lang, "/register")}
                    className="font-semibold text-primary underline-offset-2 hover:underline dark:text-gold"
                  >
                    {bn ? "নিবন্ধন করুন" : "Register"}
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </>
      );
    }
  }

  // ——— no attached PDF: a friendly note with the exits ———
  if (!item.fileUrl) {
    return (
      <>
        <PageHero
          eyebrow={bn ? "লাইব্রেরি ক্যাটালগ" : "Library Catalogue"}
          title={title}
          description={
            bn
              ? "এই আইটেমে এখনো কোনো পিডিএফ সংযুক্ত হয়নি।"
              : "No PDF is attached to this item yet."
          }
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
            { label: title, href: libraryItemHref(lang, item.slug) },
            { label: bn ? "রিডার" : "Reader" },
          ]}
        />
        <section className="bg-parchment/60 py-14 dark:bg-secondary/30">
          <div className="container-site">
            <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                <FileWarning aria-hidden className="h-7 w-7" />
              </span>
              <h2 className="font-heading mt-4 text-lg font-semibold">
                {bn ? "পিডিএফ এখনো নেই" : "No PDF yet"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {bn
                  ? "গ্রন্থাগারিক ফাইলটি সংযুক্ত করলেই এখানে ব্রাউজার-রিডার খুলবে। ততক্ষণ রেকর্ড পাতার তথ্য দেখুন বা বাইরের লিংকে যান।"
                  : "Once the librarian attaches the file, the in-browser reader opens right here. Until then, see the record's metadata or the external link."}
              </p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                {item.externalUrl ? (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <ExternalLink aria-hidden className="h-4 w-4" />
                    {bn ? "বাইরের লিংকে যান" : "Open the external link"}
                  </a>
                ) : null}
                <Link
                  href={libraryItemHref(lang, item.slug)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/50 px-6 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
                >
                  <ArrowLeft aria-hidden className="h-4 w-4" />
                  {bn ? "রেকর্ড পাতায় ফিরুন" : "Back to the record"}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow={bn ? "লাইব্রেরি ক্যাটালগ" : "Library Catalogue"}
        title={title}
        description={
          bn
            ? "ব্রাউজারেই পড়ুন — পৃষ্ঠা বোতাম বা ← → দিয়ে যাতায়াত, জুম, আর ডকুমেন্টের ভেতরেই শব্দ খুঁজুন।"
            : "Read right in the browser — turn pages with the buttons or ← →, zoom, and find words inside the document."
        }
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
          { label: title, href: libraryItemHref(lang, item.slug) },
          { label: bn ? "রিডার" : "Reader" },
        ]}
        meta={{
          textBn: `ডিজিটাল পাঠ${item.filePages != null ? ` · ${formatNumber(item.filePages, "bn")} পৃষ্ঠা` : ""}`,
          textEn: `Digital reading${item.filePages != null ? ` · ${item.filePages} pages` : ""}`,
        }}
      />

      <section className="bg-parchment/60 py-6 sm:py-10 dark:bg-secondary/30">
        <div className="container-site">
          {/* exits above the fold — the reader owns the rest of the screen */}
          <div className="reader-chrome mb-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              href={libraryItemHref(lang, item.slug)}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary dark:hover:text-gold"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              {bn ? "রেকর্ড পাতায় ফিরুন" : "Back to the record"}
            </Link>
            <div className="flex items-center gap-2">
              <a
                href={item.fileUrl}
                download
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 px-4 py-1.5 text-[12.5px] font-semibold text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
              >
                <Download aria-hidden className="h-3.5 w-3.5" />
                {bn ? "ডাউনলোড" : "Download"}
              </a>
              {item.externalUrl ? (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
                >
                  <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                  {bn ? "বাইরের লিংক" : "External link"}
                </a>
              ) : null}
            </div>
          </div>

          <PdfReader
            lang={lang}
            itemId={item.id}
            fileUrl={item.fileUrl}
            fileName={`${title}.pdf`}
            title={item.title}
            filePages={item.filePages}
          />

          <p className="reader-chrome mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
            <BookOpenText aria-hidden className="h-3.5 w-3.5 text-gold" />
            {bn
              ? "রিডারটি pdfjs দিয়ে আপনার ব্রাউজারেই চলে — ফাইলটি কোথাও আপলোড হয় না।"
              : "The reader runs in your browser via pdfjs — the file is never uploaded anywhere else."}
          </p>
        </div>
      </section>
    </>
  );
}
