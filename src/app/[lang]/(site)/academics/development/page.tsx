import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Info } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { SdpTable } from "@/components/academics/sdp-table";
import { getSdpPrograms } from "@/lib/content/courses";
import { alternatesFor, type Lang, langPath } from "@/lib/locale";
import { env } from "@/lib/env";
import { toBnDigits } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const { canonical, languages } = alternatesFor("/academics/development", env.siteUrl);
  return {
    title: isBn
      ? "শিক্ষার্থী উন্নয়ন কার্যক্রম | আস-সুন্নাহ ইনস্টিটিউট"
      : "Student Development Programs | As-Sunnah Institute",
    description:
      "SDP — তারবিয়াহ সেশন, শর্ট কোর্স, সেমিনার, সহ-শিক্ষা কার্যক্রম, বাধ্যতামূলক পাঠ ও কমিউনিটি সার্ভিস; বাধ্যতামূলক তবে অ-ক্রেডিট।",
    alternates: { canonical, languages },
  };
}

/** /academics/development — Student Development Programs (SDP). */
export default async function DevelopmentPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const studentDevelopmentPrograms = await getSdpPrograms();

  const principles = [
    {
      id: "sdp-why",
      title: { bn: "কেন SDP?", en: "Why SDP?" },
      body: {
        bn: "গ্রেড ও সার্টিফিকেট ছাড়াও একজন আদর্শ দাঈর জন্য চাই চরিত্র, দক্ষতা ও সামাজিক দায়বোধ। SDP এই গঠনকে নিশ্চিত করে।",
        en: "Beyond grades and certificates, an ideal da'ee needs character, skills, and social responsibility. The SDP ensures this formation.",
      },
    },
    {
      id: "sdp-how",
      title: { bn: "কীভাবে পরিচালিত হয়?", en: "How It Runs?" },
      body: {
        bn: "প্রতিটি কার্যক্রমের নির্দিষ্ট ঘণ্টা বরাদ্দ রয়েছে — শিক্ষকদের তত্ত্বাবধানে ব্যাচভিত্তিক পরিকল্পনায় সারা বছর বিস্তৃত।",
        en: "Each program has designated hours — spread across the year in batch-wise planning under teacher supervision.",
      },
    },
    {
      id: "sdp-result",
      title: { bn: "মূল্যায়ন ও ফলাফল", en: "Assessment & Outcome" },
      body: {
        bn: "অংশগ্রহণ ও উপস্থাপন মূল্যায়ন করা হয়; ফলাফল চূড়ান্ত সিজিপিএতে যুক্ত হয় না — তবে কোর্স সম্পন্নের শর্ত।",
        en: "Participation and presentation are assessed; results do not count toward the CGPA — but completion is required.",
      },
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "একাডেমিক" : "Academics"}
        title={{ bn: "শিক্ষার্থী উন্নয়ন কার্যক্রম (SDP)", en: "Student Development Programs (SDP)" }}
        description={{
          bn: "পাঠ্যক্রমের বাইরে বাধ্যতামূলক কিন্তু অ-ক্রেডিট ছয়টি কার্যক্রম — জ্ঞান, চরিত্র ও নেতৃত্বের সমন্বিত গঠন।",
          en: "Six mandatory, non-credit programs beyond the curriculum — integrated formation of knowledge, character, and leadership.",
        }}
        lang={lang}
        breadcrumb={[
          { label: { bn: "একাডেমিক", en: "Academics" }, href: langPath(lang, "/academics") },
          { label: { bn: "শিক্ষার্থী উন্নয়ন কার্যক্রম", en: "Student Development" } },
        ]}
        arabicEcho="إِنَّمَا بُعِثْتُ لِأُتَمِّمَ مَكَارِمَ الْأَخْلَاقِ"
      />

      {/* ——— Principles ——— */}
      <section className="bg-background py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "ধারণা" : "The Concept"}
              title={{ bn: "SDP-র মূল ভাবনা", en: "The Idea Behind SDP" }}
              lang={lang}
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {principles.map((principle) => (
              <RevealItem key={principle.id}>
                <article className="h-full rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/10">
                  <h3 className="font-heading text-lg font-semibold leading-snug">
                    {lang === "bn" ? principle.title.bn : principle.title.en}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {lang === "bn" ? principle.body.bn : principle.body.en}
                  </p>
                </article>
              </RevealItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ——— Program table ——— */}
      <section className="bg-parchment py-16 sm:py-24 dark:bg-secondary/30">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "কার্যক্রম তালিকা" : "Program Table"}
              title={{ bn: "৬টি কার্যক্রম, নির্ধারিত ঘণ্টাসহ", en: "Six Programs with Designated Hours" }}
              description={{
                bn: `মোট ${toBnDigits(studentDevelopmentPrograms.length)}টি কার্যক্রমের উদ্দেশ্য, কার্যক্রম, প্রত্যাশিত ফলাফল ও ঘণ্টা বরাদ্দ।`,
                en: "Objectives, activities, expected outcomes, and hour allocations for every program.",
              }}
              lang={lang}
            />
          </Reveal>

          <div className="mx-auto mt-12 max-w-6xl">
            <SdpTable lang={lang} />
            <Reveal className="mt-8">
              <p className="flex items-start gap-2.5 rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm leading-relaxed text-foreground/85">
                <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>
                  {lang === "bn"
                    ? "উল্লেখ্য: SDP কার্যক্রমসমূহ সব শিক্ষার্থীর জন্য বাধ্যতামূলক, তবে এগুলো অ-ক্রেডিট (non-credit) — ফলাফল চূড়ান্ত সিজিপিএতে যুক্ত হয় না।"
                    : "Note: SDP programs are mandatory for all students but carry no academic credits — results do not count toward the final CGPA."}
                </span>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ——— Community service highlight + CTA ——— */}
      <section className="bg-background py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-emerald-deep p-8 text-ivory shadow-xl sm:p-12">
              <div aria-hidden className="pattern-lattice-light absolute inset-0" />
              <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                    <HeartHandshake aria-hidden className="h-4 w-4" />
                    {lang === "bn" ? "কমিউনিটি সার্ভিস" : "Community Service"}
                  </span>
                  <h2 className="font-heading mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
                    {lang === "bn" ? "ফিল্ডওয়ার্কে নামা দাঈরা" : "Da'ees in the Field"}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ivory/75 sm:text-base">
                    {lang === "bn"
                      ? "সাপ্তাহিক কমিউনিটি সার্ভিসের অংশ হিসেবে শিক্ষার্থীরা সরাসরি মাঠে দাওয়াতি কার্যক্রম পরিচালনা করে — এ পর্যন্ত সফলভাবে সম্পন্ন হয়েছে ১ সপ্তাহ ব্যাপী একটি বড় ফিল্ডওয়ার্ক।"
                      : "As part of weekly community service, students run dawah activities directly in the field — including a successful week-long fieldwork campaign."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={langPath(lang, "/about/campus")}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-6 text-sm font-semibold text-gold transition-all hover:bg-gold hover:text-gold-foreground"
                  >
                    {lang === "bn" ? "ক্যাম্পাস লাইফ দেখুন" : "See Campus Life"}
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
