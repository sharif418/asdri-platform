import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { GoldRule, StarMotif } from "@/components/shared/ornaments";
import { SectionHeading } from "@/components/shared/section-heading";
import { ObjectivesList } from "@/components/about/objectives-list";
import { instituteIntro, objectivesList } from "@/content/about";
import { corePillars, visionStatement } from "@/content/stats";
import { siteConfig } from "@/content/site";
import { pick } from "@/types";
import type { LucideIcon } from "lucide-react";
import { BookOpen, GitMerge, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

const pillarIcons: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  "git-merge": GitMerge,
  sprout: Sprout,
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "লক্ষ্য ও উদ্দেশ্য | Vision & Objectives",
    description:
      "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউটের পরিচিতি, ভিশন বিবৃতি, চৌদ্দটি মূল উদ্দেশ্য ও কোর পিলার। Vision, objectives, and core pillars of the As-Sunnah Dawah & Research Institute.",
    alternates: { canonical: "/about" },
  };
}

/** /about — institute intro, vision statement, full objectives, core pillars. */
export default async function AboutPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "আমাদের সম্পর্কে" : "About Us"}
        title={{ bn: "লক্ষ্য ও উদ্দেশ্য", en: "Vision & Objectives" }}
        description={{
          bn: "একটি জ্ঞাননির্ভর, সচেতন ও দায়িত্বশীল মুসলিম সমাজ গড়ার প্রত্যয়ে আমাদের যাত্রা।",
          en: "Our journey toward a knowledge-based, conscious, and responsible Muslim society.",
        }}
        lang={lang}
        breadcrumb={[{ label: { bn: "আমাদের সম্পর্কে", en: "About" }, href: langPath(lang, "/about") }]}
        arabicEcho="وَقُل رَّبِّ زِدْنِي عِلْمًا"
      />

      {/* ——— Institute introduction ——— */}
      <section className="bg-background py-16 sm:py-24">
        <div className="container-site grid items-start gap-12 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <SectionHeading
              eyebrow={lang === "bn" ? "পরিচিতি" : "Introduction"}
              title={{ bn: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট", en: "As-Sunnah Dawah & Research Institute" }}
              lang={lang}
              align="left"
              as="h2"
            />
            <div className="mt-6 space-y-5">
              {instituteIntro.map((paragraph, index) => (
                <p key={`intro-${index}`} className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                  {pick(paragraph, lang)}
                </p>
              ))}
              <p className="pt-2 text-sm font-medium text-foreground/70">
                {lang === "bn" ? siteConfig.parentBn : siteConfig.parentEn} ·{" "}
                {lang === "bn" ? siteConfig.addressBn : siteConfig.addressEn}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-2">
            <aside className="relative overflow-hidden rounded-2xl bg-emerald-deep p-8 text-ivory shadow-xl">
              <div aria-hidden className="pattern-lattice-light absolute inset-0" />
              <div aria-hidden className="absolute -right-10 -top-10 opacity-10">
                <StarMotif className="h-40 w-40 text-gold" />
              </div>
              <div className="relative">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                  <Eye aria-hidden className="h-4 w-4" />
                  {lang === "bn" ? "ভিশন" : "Vision"}
                </span>
                <p className="font-heading mt-5 text-lg leading-relaxed text-ivory sm:text-xl">
                  “{pick(visionStatement, lang)}”
                </p>
                <GoldRule tone="on-dark" className="mt-6" />
              </div>
            </aside>
          </Reveal>
        </div>
      </section>

      {/* ——— Core pillars ——— */}
      <section className="bg-parchment py-16 sm:py-24 dark:bg-secondary/30">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "মূল স্তম্ভ" : "Core Pillars"}
              title={{ bn: "প্রতিষ্ঠানের তিনটি কোর পিলার", en: "The Three Core Pillars" }}
              description={{
                bn: "বুদ্ধিবৃত্তিক দাওয়াহ, জ্ঞানের সেতুবন্ধন ও চারিত্রিক তারবিয়াহ — এই তিন স্তম্ভের ওপর দাঁড়িয়ে আমাদের সব কার্যক্রম।",
                en: "Intellectual dawah, bridging of knowledge, and character tarbiyah — every program rests on these three pillars.",
              }}
              lang={lang}
            />
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {corePillars.map((pillar, index) => {
              const Icon = pillarIcons[pillar.icon] ?? BookOpen;
              return (
                <Reveal key={pillar.id} delay={index * 0.1}>
                  <article className="relative h-full overflow-hidden rounded-xl border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/10">
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold shadow-md">
                      <Icon aria-hidden className="h-6 w-6" />
                    </span>
                    <h3 className="font-heading mt-5 text-lg font-semibold leading-snug">{pick(pillar.title, lang)}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pick(pillar.description, lang)}</p>
                    <span
                      aria-hidden
                      className={cn("absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r opacity-80", index === 1 ? "from-gold to-amber-300" : "from-emerald-700 to-emerald-500")}
                    />
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ——— Objectives list (server component include) ——— */}
      <ObjectivesList lang={lang} />

      {/* ——— Next-step CTA ——— */}
      <section className="bg-background pb-16 sm:pb-24">
        <div className="container-site">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-emerald-deep p-8 text-ivory shadow-xl sm:p-12">
              <div aria-hidden className="pattern-lattice-light absolute inset-0" />
              <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                <div className="max-w-2xl">
                  <h2 className="font-heading text-2xl font-semibold leading-snug sm:text-3xl">
                    {lang === "bn" ? "আমাদের কার্যক্রম আরও জানুন" : "Explore What We Do"}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ivory/75 sm:text-base">
                    {lang === "bn"
                      ? `মোট ${objectivesList.length}টি উদ্দেশ্যের বাস্তবায়ন ঘটে আমাদের একাডেমিক, গবেষণা ও দাওয়াতি কার্যক্রমের মাধ্যমে — নেতৃত্ব, ক্যাম্পাস ও অ্যালামনাই সম্পর্কে আরও জানুন।`
                      : "All fourteen objectives come alive through our academic, research, and dawah programs — discover our leadership, campus, and alumni."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={langPath(lang, "/about/leadership")}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-6 text-sm font-semibold text-gold transition-all hover:bg-gold hover:text-gold-foreground"
                  >
                    {lang === "bn" ? "নেতৃত্ব ও প্রশাসন" : "Leadership"}
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </Link>
                  <Link
                    href={langPath(lang, "/academics")}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-gradient px-6 text-sm font-semibold text-gold-foreground shadow-md transition-all hover:opacity-95"
                  >
                    {lang === "bn" ? "একাডেমিক প্রোগ্রাম" : "Academic Programs"}
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
