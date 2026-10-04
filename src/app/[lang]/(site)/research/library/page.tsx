import type { Metadata } from "next";
import { alternatesFor, langPath, type Lang } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { env } from "@/lib/env";
import Link from "next/link";
import { ArrowRight, BookMarked } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { GoldRule } from "@/components/shared/ornaments";
import { JournalCard } from "@/components/research/journal-card";
import { getPublications, getDownloadItems } from "@/lib/content/research";
import { getSiteConfig } from "@/lib/content/site";
import { pick } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const siteConfig = await getSiteConfig();
  const { canonical, languages } = alternatesFor("/research/library", env.siteUrl);
  return {
    title: lang === "bn" ? `লাইব্রেরি ও জার্নাল — ${siteConfig.nameBn}` : `Library & Journals — ${siteConfig.nameEn}`,
    description:
      lang === "bn"
        ? "আস-সুন্নাহ জার্নাল ও গবেষণা বার্তা — মেটাডেটা, সাইটেশন জেনারেটর (APA/Chicago/MLA) ও ডিজিটাল রিডারসহ লাইব্রেরি ক্যাটালগ।"
        : "As-Sunnah journals and research bulletins — a library catalog with metadata, an APA/Chicago/MLA citation generator, and a digital reader.",
    alternates: { canonical, languages },
  };
}

/** Library & journals — catalog cards with citation generator and reader. */
export default async function LibraryPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  if (!(await isFeatureEnabled("research"))) {
    return <ModuleUnavailable lang={lang} moduleLabelBn="লাইব্রেরি ও জার্নাল" moduleLabelEn="Library & journals" />;
  }
  const [publications, downloadItems] = await Promise.all([getPublications(), getDownloadItems()]);
  const siteConfig = await getSiteConfig();
  const journals = publications.filter((item) => item.type === "journal");
  const referenceFiles = downloadItems.filter((item) => item.category === "prospectus" || item.category === "syllabus");

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "গবেষণা ও প্রকাশনা" : "Research & Publications"}
        title={lang === "bn" ? "লাইব্রেরি ও জার্নাল" : "Library & Journals"}
        description={
          lang === "bn"
            ? "ইনস্টিটিউটের জার্নাল ও পত্রিকা — সম্পাদক, প্রকাশকাল ও ISSN মেটাডেটাসহ; এক ক্লিকে APA/Chicago/MLA সাইটেশন কপি করুন।"
            : "The institute's journals and periodicals — with editor, date, and ISSN metadata; copy APA/Chicago/MLA citations in one click."
        }
        lang={lang}
        breadcrumb={[
          { label: lang === "bn" ? "গবেষণা" : "Research", href: langPath(lang, "/research") },
          { label: lang === "bn" ? "লাইব্রেরি ও জার্নাল" : "Library & Journals" },
        ]}
        arabicEcho="اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ"
      />

      {/* ————— journal catalog ————— */}
      <section className="py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "ক্যাটালগ" : "Catalog"}
              title={lang === "bn" ? "জার্নাল ও পত্রিকাসমূহ" : "Journals & Periodicals"}
              description={
                lang === "bn"
                  ? "প্রতিটি কার্ড থেকে সরাসরি সাইটেশন কপি করুন অথবা ডিজিটাল রিডারে পিডিএফ প্রিভিউ দেখুন।"
                  : "Copy a citation directly from each card or preview the PDF inside the digital reader."
              }
              lang={lang}
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-2">
            {journals.map((journal) => (
              <RevealItem key={journal.id}>
                <JournalCard item={journal} lang={lang} />
              </RevealItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ————— how the reader works ————— */}
      <section className="bg-parchment py-16 sm:py-20">
        <div className="container-site">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <BookMarked aria-hidden className="mx-auto h-8 w-8 text-gold" />
              <h2 className="font-heading mt-4 text-2xl font-semibold sm:text-3xl">
                {lang === "bn" ? "এমবেডেড পিডিএফ ভিউয়ার" : "The Embedded PDF Reader"}
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {lang === "bn"
                  ? "প্রতিটি জার্নাল কার্ডের “রিডারে খুলুন” বোতামে ক্লিক করলে ইনস্টিটিউটের অফিসিয়াল প্যাডে সাজানো প্রিভিউ খুলে — সেখানে পৃষ্ঠা নেভিগেটর, জুম, ফুল-টেক্সট সার্চ ও অফলাইন রিডিংয়ের সুবিধা বর্ণিত আছে, সঙ্গে ডাউনলোড ও শেয়ার বোতাম।"
                  : "Clicking \"Open in Reader\" on any journal card opens a pad-styled preview describing page navigation, zoom, full-text search, and offline reading — with download and share actions."}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ————— reference downloads ————— */}
      <section className="py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "রেফারেন্স" : "Reference"}
              title={lang === "bn" ? "লাইব্রেরি-সংশ্লিষ্ট ডাউনলোড" : "Library-Related Downloads"}
              description={
                lang === "bn"
                  ? "গবেষণার সঙ্গে সরাসরি সম্পর্কিত প্রসপেক্টাস ও সিলেবাস ডকুমেন্ট।"
                  : "Prospectus and syllabus documents directly relevant to research."
              }
              lang={lang}
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2">
            {referenceFiles.map((file) => (
              <RevealItem key={file.id}>
                <a
                  href={file.url ?? "#"}
                  download
                  className="group flex items-center justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
                >
                  <div>
                    <h3 className="text-sm font-semibold leading-snug group-hover:text-primary">
                      {pick(file.title, lang)}
                    </h3>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {file.fileType} · {file.sizeLabel}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                    <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              </RevealItem>
            ))}
          </Stagger>

          <Reveal delay={0.12}>
            <GoldRule className="mt-14" />
            <div className="mt-8 text-center">
              <Link
                href={langPath(lang, "/research/publications")}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {lang === "bn" ? "শিক্ষক-গবেষকদের প্রকাশনা দেখুন" : "Browse Faculty Publications"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
