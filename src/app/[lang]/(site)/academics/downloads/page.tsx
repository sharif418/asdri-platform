import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { DownloadCenter } from "@/components/academics/download-center";
import { getDownloadItems } from "@/lib/content/research";
import { isFeatureEnabled } from "@/lib/settings";
import { alternatesFor, type Lang, langPath } from "@/lib/locale";
import { env } from "@/lib/env";
import { toBnDigits } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const { canonical, languages } = alternatesFor("/academics/downloads", env.siteUrl);
  return {
    title: isBn ? "ডাউনলোড সেন্টার | আস-সুন্নাহ ইনস্টিটিউট" : "Download Center | As-Sunnah Institute",
    description:
      "সিলেবাস, ভর্তি ফর্ম, দাওয়াহ ম্যাটেরিয়ালস ও প্রসপেক্টাস — আস-সুন্নাহ ইনস্টিটিউটের ডাউনলোডযোগ্য রিসোর্স।",
    alternates: { canonical, languages },
  };
}

/** /academics/downloads — category-filtered download center. */
export default async function DownloadsPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const downloadItems = await getDownloadItems();
  const downloadsEnabled = await isFeatureEnabled("downloads");

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "একাডেমিক" : "Academics"}
        title={{ bn: "ডাউনলোড সেন্টার", en: "Download Center" }}
        description={{
          bn: `সিলেবাস, ফর্ম, দাওয়াহ ম্যাটেরিয়ালস ও প্রসপেক্টাস — মোট ${toBnDigits(downloadItems.length)}টি ডাউনলোডযোগ্য রিসোর্স।`,
          en: `Syllabi, forms, dawah materials, and the prospectus — ${downloadItems.length} downloadable resources in total.`,
        }}
        lang={lang}
        breadcrumb={[
          { label: { bn: "একাডেমিক", en: "Academics" }, href: langPath(lang, "/academics") },
          { label: { bn: "ডাউনলোড সেন্টার", en: "Download Center" } },
        ]}
      />

      <section className="bg-background py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "রিসোর্স" : "Resources"}
              title={{ bn: "প্রয়োজনীয় ফাইলসমূহ", en: "Essential Files" }}
              description={{
                bn: "বিভাগ অনুযায়ী ফিল্টার করে প্রয়োজনীয় ফাইলটি খুঁজে নিন — সব ফাইল বিনামূল্যে ডাউনলোডযোগ্য।",
                en: "Filter by category to find the file you need — every file is free to download.",
              }}
              lang={lang}
            />
          </Reveal>

          <div className="mx-auto mt-12 max-w-4xl">
            {downloadsEnabled ? (
              <DownloadCenter lang={lang} items={downloadItems} />
            ) : (
              <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-gold/40 bg-card/60 px-6 py-14 text-center">
                <p className="font-heading text-base font-semibold text-foreground">
                  {lang === "bn" ? "ডাউনলোড সেন্টারটি এখন সাময়িকভাবে বন্ধ রাখা হয়েছে।" : "The download center is temporarily unavailable."}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lang === "bn" ? "শীঘ্রই আবার ফিরে আসছে।" : "It will be back soon."}
                </p>
              </div>
            )}
          </div>

          <Reveal className="mt-12">
            <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-gold/30 bg-gold/5 p-7 text-center sm:flex-row sm:text-left">
              <p className="flex items-center gap-2.5 text-sm font-medium sm:text-[15px]">
                <FolderOpen aria-hidden className="h-5 w-5 shrink-0 text-gold" />
                {lang === "bn"
                  ? "আরও গবেষণা রিসোর্স ও প্রকাশনার জন্য লাইব্রেরি পেজটি দেখুন।"
                  : "For more research resources and publications, visit the library page."}
              </p>
              <Link
                href={langPath(lang, "/research/library")}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-gold-gradient px-6 text-sm font-semibold text-gold-foreground shadow-md transition-all hover:opacity-95"
              >
                {lang === "bn" ? "লাইব্রেরি ও জার্নাল" : "Library & Journal"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
