import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BedDouble, HandCoins, Library, MoonStar, NotebookPen, UtensilsCrossed, Wallet } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { Bismillah, CornerOrnament, StarMotif } from "@/components/shared/ornaments";
import { getFacilities, getScholarshipInfo } from "@/lib/content/admission";
import { getSiteConfig } from "@/lib/content/site";
import { alternatesFor, type Lang, langPath } from "@/lib/locale";
import { env } from "@/lib/env";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { Language, LocalizedText } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const siteConfig = await getSiteConfig();
  const { canonical, languages } = alternatesFor("/admissions/scholarships", env.siteUrl);
  return {
    title: isBn ? `স্কলারশিপ ও আর্থিক সহায়তা — ${siteConfig.shortBn}` : `Scholarships & Financial Aid — ${siteConfig.shortEn}`,
    description:
      "যাকাত ফান্ড থেকে পরিচালিত ১০০% স্কলারশিপ — মেধাবী ও অস্বচ্ছল শিক্ষার্থীদের আবাসন, খাবার ও টিউশনসহ সম্পূর্ণ ব্যয়ভার।",
    alternates: { canonical, languages },
  };
}

const facilityIcons: Record<string, typeof BedDouble> = {
  "bed-double": BedDouble,
  library: Library,
  "notebook-pen": NotebookPen,
  "moon-star": MoonStar,
};

/** Scholarships & financial aid — the 100% zakat-funded program. */
export default async function ScholarshipsPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const [scholarshipInfo, facilities] = await Promise.all([getScholarshipInfo(), getFacilities()]);

  const coveredItems: { icon: typeof BedDouble; title: LocalizedText; note: LocalizedText }[] = [
    {
      icon: BedDouble,
      title: { bn: "আবাসন", en: "Accommodation" },
      note: {
        bn: "পরিচ্ছন্ন আবাসিক কক্ষ, পৃথক স্টাডি টেবিল ও নিরিবিলি পড়ার পরিবেশ।",
        en: "Clean residential rooms with separate study desks and a quiet environment.",
      },
    },
    {
      icon: UtensilsCrossed,
      title: { bn: "খাবার", en: "Meals" },
      note: {
        bn: "দিনে তিন বেলা পুষ্টিকর খাবার — ছাত্রদের সুস্থতা সর্বোচ্চ অগ্রাধিকার।",
        en: "Three nutritious meals daily — student wellbeing is a top priority.",
      },
    },
    {
      icon: Wallet,
      title: { bn: "টিউশন ফিস", en: "Tuition" },
      note: {
        bn: "কোর্সের সম্পূর্ণ টিউশন ফিস ফাউন্ডেশনের যাকাত ফান্ড থেকে বহন করা হয়।",
        en: "The full course tuition is borne by the foundation's zakat fund.",
      },
    },
    {
      icon: HandCoins,
      title: { bn: "শিক্ষাভাতা ও যাতায়াত ভাতা", en: "Education & Travel Stipends" },
      note: {
        bn: "বিশেষ কিছু কোর্সে অতিরিক্ত মাসিক শিক্ষাভাতা ও যাতায়াত ভাতার সুযোগ।",
        en: "Selected courses offer additional monthly education and travel stipends.",
      },
    },
  ];

  const proofSteps: LocalizedText[] = [
    {
      bn: "আবেদনকারীকে শরীয়াহ অনুযায়ী যাকাত গ্রহণের উপযুক্ত (গরিব/অসচ্ছল) হতে হবে।",
      en: "The applicant must be a Shariah-eligible zakat recipient (genuine financial need).",
    },
    {
      bn: "স্কলারশিপ/যাকাত আবেদন ফর্মে আর্থিক অবস্থার বিবরণ সত্যনিষ্ঠভাবে পূরণ করতে হবে।",
      en: "Fill the scholarship/zakat application form truthfully, describing your financial situation.",
    },
    {
      bn: "প্রয়োজনে এলাকার বিশ্বস্ত আলেম/প্রতিষ্ঠানের সুপারিশ বা আর্থিক অবস্থার প্রমাণাদি পেশ করতে হবে।",
      en: "Provide a recommendation from a trusted local scholar/institution or evidence of financial hardship when asked.",
    },
    {
      bn: "ফাউন্ডেশনের যাচাই টিম প্রদত্ত তথ্য যাচাই করে চূড়ান্ত অনুমোদন দেয়।",
      en: "The foundation's verification team reviews the information before final approval.",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "ভর্তি" : "Admissions"}
        title={lang === "bn" ? "স্কলারশিপ ও আর্থিক সহায়তা" : "Scholarships & Financial Aid"}
        description={pick(scholarshipInfo.headline, lang)}
        lang={lang}
        breadcrumb={[
          { label: lang === "bn" ? "ভর্তি" : "Admissions", href: langPath(lang, "/admissions") },
          { label: lang === "bn" ? "স্কলারশিপ" : "Scholarships" },
        ]}
        arabicEcho="إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ"
      />

      {/* ————— program statement ————— */}
      <section className="py-16 sm:py-24">
        <div className="container-site">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <Bismillah className="text-gold" />
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="font-heading mt-6 text-2xl font-semibold leading-snug sm:text-3xl">
                {pick(scholarshipInfo.headline, lang)}
              </h2>
            </Reveal>
            <div className="mt-8 space-y-5 text-left sm:text-justify">
              {scholarshipInfo.body.map((paragraph, index) => (
                <Reveal key={index} delay={0.12 + index * 0.05}>
                  <p className="leading-[1.9] text-muted-foreground">{pick(paragraph, lang)}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ————— what's covered ————— */}
      <section className="bg-parchment py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "কভারেজ" : "Coverage"}
              title={lang === "bn" ? "স্কলারশিপে যা যা অন্তর্ভুক্ত" : "What the Scholarship Covers"}
              description={
                lang === "bn"
                  ? "উপযুক্ততা যাচাই হওয়ার পর একজন শিক্ষার্থীর নিম্নোক্ত যাবতীয় ব্যয়ভার ফাউন্ডেশন বহন করে।"
                  : "Once eligibility is verified, the foundation covers all of the following for the student."
              }
              lang={lang}
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {coveredItems.map((item) => (
              <RevealItem key={item.title.en}>
                <article className="group relative h-full overflow-hidden rounded-2xl border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <item.icon aria-hidden className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading mt-4 text-base font-semibold">{pick(item.title, lang)}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{pick(item.note, lang)}</p>
                </article>
              </RevealItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ————— how to prove eligibility ————— */}
      <section className="py-16 sm:py-24">
        <div className="container-site">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <SectionHeading
                align="left"
                eyebrow={lang === "bn" ? "যাচাই প্রক্রিয়া" : "Verification"}
                title={lang === "bn" ? "উপযুক্ততা প্রমাণের ধাপসমূহ" : "How to Prove Eligibility"}
                description={
                  lang === "bn"
                    ? "যাকাতের শরীয়াহ বিধান কঠোরভাবে মেনে স্কলারশিপ প্রদান করা হয় — তাই একটি স্পষ্ট যাচাই প্রক্রিয়া রয়েছে।"
                    : "Scholarships strictly follow the Shariah rules of zakat — hence a clear verification process."
                }
                lang={lang}
              />
              <ol className="mt-8 space-y-4">
                {proofSteps.map((step, index) => (
                  <li key={index} className="flex gap-4">
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold/10 font-heading text-sm font-bold text-gold"
                    >
                      {lang === "bn" ? toBnDigits(index + 1) : String(index + 1)}
                    </span>
                    <p className="pt-1 text-sm leading-relaxed text-muted-foreground">{pick(step, lang)}</p>
                  </li>
                ))}
              </ol>
              <Link
                href={langPath(lang, "/academics/downloads")}
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-gold"
              >
                {lang === "bn" ? "স্কলারশিপ/যাকাত আবেদন ফর্ম ডাউনলোড" : "Download the Scholarship/Zakat Form"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="relative h-full overflow-hidden rounded-2xl border bg-emerald-deep p-6 text-ivory shadow-lg sm:p-8">
                <div aria-hidden className="pattern-lattice-light absolute inset-0" />
                <CornerOrnament className="right-3 top-3" />
                <div className="relative">
                  <h3 className="font-heading flex items-center gap-2.5 text-lg font-semibold">
                    <HandCoins aria-hidden className="h-5 w-5 text-gold" />
                    {lang === "bn" ? "আবাসিক জীবনের সুবিধাসমূহ" : "Residential Life Facilities"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ivory/70">
                    {lang === "bn"
                      ? "স্কলারশিপভোগী প্রতিটি শিক্ষার্থী ক্যাম্পাসের সব সুবিধা সমানভাবে পায় —"
                      : "Every scholarship student equally enjoys all campus facilities —"}
                  </p>
                  <ul className="mt-6 space-y-4">
                    {facilities.map((facility) => {
                      const Icon = facilityIcons[facility.icon] ?? BadgeCheck;
                      return (
                        <li key={facility.id} className="rounded-xl border border-ivory/15 bg-white/[0.06] p-4 backdrop-blur">
                          <div className="flex items-center gap-2.5">
                            <Icon aria-hidden className="h-4.5 w-4.5 text-gold" />
                            <h4 className="text-sm font-semibold">{pick(facility.title, lang)}</h4>
                          </div>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-ivory/65">
                            {pick(facility.description, lang)}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ————— donate CTA ————— */}
      <section className="relative overflow-hidden bg-emerald-deep py-16 text-ivory sm:py-20">
        <div aria-hidden className="pattern-lattice-light absolute inset-0" />
        <div aria-hidden className="absolute -left-20 bottom-0 h-64 w-64 opacity-[0.06]">
          <StarMotif className="h-full w-full text-gold" />
        </div>
        <div className="container-site relative">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
                {lang === "bn"
                  ? "আপনার যাকাতই হতে পারে কারো জীবন বদলে দেওয়ার সদকা"
                  : "Your Zakat Can Be the Sadaqah That Changes a Life"}
              </h2>
              <p className="mt-4 leading-relaxed text-ivory/75">
                {lang === "bn"
                  ? "এই স্কলারশিপ কার্যক্রম চলে দাতিয়্যদের যাকাত ও সদকার মাধ্যমে। আপনিও যুক্ত হতে পারেন — মেধাবী অস্বচ্ছল শিক্ষার্থীদের দ্বীনি শিক্ষার পথ খুলে দিন।"
                  : "This program runs on donors' zakat and sadaqah. Join us — open the door of sacred knowledge for talented students in need."}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={langPath(lang, "/support")}
                  className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3 text-sm font-bold text-gold-foreground shadow-lg transition-transform hover:scale-[1.02]"
                >
                  {lang === "bn" ? "সাপোর্ট করুন" : "Support the Fund"}
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
                <Link
                  href={langPath(lang, "/support/zakat-calculator")}
                  className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-7 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
                >
                  {lang === "bn" ? "যাকাত ক্যালকুলেটর" : "Zakat Calculator"}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
