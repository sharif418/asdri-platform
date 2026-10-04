import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { PublicationGrid } from "@/components/research/publication-grid";
import { getPublications } from "@/lib/content/research";
import { getSiteConfig } from "@/lib/content/site";
import { alternatesFor, type Lang, langPath } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { env } from "@/lib/env";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const siteConfig = await getSiteConfig();
  const { canonical, languages } = alternatesFor("/research/publications", env.siteUrl);
  return {
    title: isBn ? `প্রকাশনা ও গ্রন্থ — ${siteConfig.shortBn}` : `Publications & Books — ${siteConfig.shortEn}`,
    description:
      "শিক্ষক-গবেষকদের জার্নাল প্রবন্ধ, গ্রন্থ ও রিসার্চ পেপার — ধরন অনুযায়ী ফিল্টারযোগ্য প্রকাশনা সংগ্রহ।",
    alternates: { canonical, languages },
  };
}

/** Faculty publications & books — filterable grid with CSS covers. */
export default async function PublicationsPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  if (!(await isFeatureEnabled("research"))) {
    return <ModuleUnavailable lang={lang} moduleLabelBn="প্রকাশনা ও গ্রন্থপঞ্জি" moduleLabelEn="Publications" />;
  }
  const publications = await getPublications();

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "গবেষণা ও প্রকাশনা" : "Research & Publications"}
        title={lang === "bn" ? "প্রকাশনা ও গ্রন্থপঞ্জি" : "Publications & Books"}
        description={
          lang === "bn"
            ? "ইনস্টিটিউটের গবেষণা বোর্ড ও শিক্ষকদের জার্নাল, গ্রন্থ ও রিসার্চ পেপার — ধরন অনুযায়ী সাজানো।"
            : "Journals, books, and research papers from the research board and faculty — organized by type."
        }
        lang={lang}
        breadcrumb={[
          { label: lang === "bn" ? "গবেষণা" : "Research", href: langPath(lang, "/research") },
          { label: lang === "bn" ? "প্রকাশনা" : "Publications" },
        ]}
        arabicEcho="وَمَا يَنطِقُ عَنِ الْهَوَى"
      />

      <section className="bg-parchment py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "সংগ্রহ" : "Collection"}
              title={lang === "bn" ? "শিক্ষক ও গবেষকদের রচনাবলি" : "Faculty & Researcher Works"}
              description={
                lang === "bn"
                  ? "প্রতিটি কভারে শিরোনাম, লেখক ও প্রকাশকাল — সাইটেশন কপি করতে লাইব্রেরি পাতায় যান।"
                  : "Each cover shows the title, author, and year — copy citations from the library page."
              }
              lang={lang}
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <PublicationGrid items={publications} lang={lang} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
