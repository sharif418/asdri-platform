import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { GoldRule, StarMotif } from "@/components/shared/ornaments";
import { ResearchLinks } from "@/components/research/research-links";
import { ResearchAreas } from "@/components/research/research-areas";
import { getResearchProjects } from "@/lib/content/research";
import { getSiteConfig } from "@/lib/content/site";
import { alternatesFor, langPath, type Lang } from "@/lib/locale";
import { env } from "@/lib/env";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const siteConfig = await getSiteConfig();
  const { canonical, languages } = alternatesFor("/research", env.siteUrl);
  return {
    title: isBn ? `গবেষণা ও প্রকাশনা — ${siteConfig.shortBn}` : `Research & Publications — ${siteConfig.shortEn}`,
    description:
      "সমকালীন মতাদর্শের বুদ্ধিবৃত্তিক জবাব, হাদীস-গবেষণা, তুলনামূলক ধর্মতত্ত্ব ও ফিকহ — আস-সুন্নাহ ইনস্টিটিউটের গবেষণা কার্যক্রম।",
    alternates: { canonical, languages },
  };
}

/** Research overview — mission, areas, and destinations. */
export default async function ResearchPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const researchProjects = await getResearchProjects();
  const ongoingCount = researchProjects.filter((p) => p.status === "ongoing").length;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "গবেষণা ও প্রকাশনা" : "Research & Publications"}
        title={lang === "bn" ? "গবেষণা পরিচিতি" : "Research Overview"}
        description={
          lang === "bn"
            ? "দাওয়াতি জবাব যেন যুক্তিনির্ভর ও প্রামাণ্য হয় — সে লক্ষ্যে ইনস্টিটিউটের স্বতন্ত্র গবেষণা বোর্ড ও পিয়ার-রিভিউড জার্নাল কার্যক্রম।"
            : "A dedicated research board and peer-reviewed journal ensure every dawah response is rational and evidence-based."
        }
        lang={lang}
        breadcrumb={[{ label: lang === "bn" ? "গবেষণা পরিচিতি" : "Research Overview" }]}
        arabicEcho="وَمَنْ أَحْسَنُ قَوْلًا مِّمَّن دَعَا إِلَى اللَّهِ"
      />

      {/* ————— mission ————— */}
      <section className="py-16 sm:py-24">
        <div className="container-site">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <SectionHeading
                eyebrow={lang === "bn" ? "লক্ষ্য ও মিশন" : "Mission"}
                title={
                  lang === "bn"
                    ? "প্রামাণ্য জ্ঞানের ভিত্তিতে দাওয়াহ ও জবাব"
                    : "Dawah & Responses Grounded in Authentic Knowledge"
                }
                description={
                  lang === "bn"
                    ? "মুসলিম উম্মাহর সামনে যুগে যুগে নতুন নতুন মতাদর্শ এসেছে — উত্তর দিতে হয়েছে যুক্তি, প্রমাণ ও গবেষণার ভিত্তিতে। ইনস্টিটিউটের গবেষণা বিভাগ সে দায়িত্বই পালন করে: সমকালীন ফিতনার শ্রেণিবিন্যাস, প্রামাণ্য জবাব প্রণয়ন এবং বাংলা ভাষায় গবেষণালব্ধ জ্ঞানের প্রসার।"
                    : "Every era brings new ideologies to the ummah — and answering them demands reason, evidence, and research. The institute's research wing classifies contemporary fitnah, formulates evidence-based responses, and spreads researched knowledge in the Bangla language."
                }
                lang={lang}
              />
            </Reveal>
            <Reveal delay={0.1} className="mt-10">
              <GoldRule />
            </Reveal>
            <Reveal delay={0.14}>
              <dl className="mt-10 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {lang === "bn" ? "গবেষণা খাত" : "Tracks"}
                  </dt>
                  <dd className="font-heading mt-1.5 text-2xl font-bold text-primary sm:text-3xl">
                    {lang === "bn" ? toBnDigits(6) : "6"}
                  </dd>
                </div>
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {lang === "bn" ? "চলমান প্রকল্প" : "Ongoing Projects"}
                  </dt>
                  <dd className="font-heading mt-1.5 text-2xl font-bold text-primary sm:text-3xl">
                    {lang === "bn" ? toBnDigits(ongoingCount) : String(ongoingCount)}
                  </dd>
                </div>
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {lang === "bn" ? "কল ফর পেপার্স" : "Journal Calls"}
                  </dt>
                  <dd className="font-heading mt-1.5 text-2xl font-bold text-primary sm:text-3xl">
                    {lang === "bn" ? toBnDigits(1) : "1"}
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ————— areas ————— */}
      <section className="bg-parchment py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "গবেষণা ক্ষেত্র" : "Research Areas"}
              title={lang === "bn" ? "যেসব মোক্ষামে আমরা কাজ করি" : "The Fronts We Work On"}
              description={
                lang === "bn"
                  ? "প্রতিটি খাতে আর্টিকেল, ভিডিও ও পিডিএফ প্রকাশনার সমন্বয়ে বহুমাত্রিক কনটেন্ট তৈরি হয়।"
                  : "Each track produces multi-format content — articles, videos, and PDF publications."
              }
              lang={lang}
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <ResearchAreas lang={lang} />
          </Reveal>
        </div>
      </section>

      {/* ————— destinations ————— */}
      <section className="py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "প্রবেশদ্বার" : "Destinations"}
              title={lang === "bn" ? "গবেষণা বিভাগের পাতাসমূহ" : "Research Section Pages"}
              description={
                lang === "bn"
                  ? "লাইব্রেরি থেকে ফতোয়া ব্যাংক — গবেষণা ও প্রকাশনার পাঁচটি পূর্ণাঙ্গ শাখা।"
                  : "From the library to the fatwa bank — five complete branches of research & publications."
              }
              lang={lang}
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <ResearchLinks lang={lang} />
          </Reveal>
        </div>
      </section>

      {/* ————— quiet closing ————— */}
      <section className="relative overflow-hidden bg-emerald-deep py-14 text-ivory">
        <div aria-hidden className="pattern-lattice-light absolute inset-0" />
        <div aria-hidden className="absolute -left-24 top-1/2 hidden h-72 w-72 -translate-y-1/2 opacity-[0.05] lg:block">
          <StarMotif className="h-full w-full text-gold" />
        </div>
        <div className="container-site relative">
          <Reveal>
            <p className="font-arabic mx-auto max-w-2xl text-center text-xl leading-relaxed text-gold/90 sm:text-2xl">
              قُلْ هَاتُوا بُرْهَانَكُمْ إِنْ كُنْتُمْ صَادِقِينَ
            </p>
            <p className="mt-4 text-center text-sm leading-relaxed text-ivory/70">
              {lang === "bn"
                ? "“তোমরা সত্যবাদী হলে প্রমাণ উপস্থিত করো” — সূরা আল-বাকারা ২:১১১। প্রমাণভিত্তিক জবাবই আমাদের গবেষণার ভিত্তি।"
                : "\"Produce your proof if you are truthful\" — Al-Baqarah 2:111. Evidence-based response is the foundation of our research."}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
