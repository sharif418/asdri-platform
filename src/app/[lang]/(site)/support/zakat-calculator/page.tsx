import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Coins, HandCoins, Hourglass, Scale, ShieldAlert } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { GoldRule } from "@/components/shared/ornaments";
import { ZakatCalculator } from "@/components/donations/zakat-calculator";

export const metadata: Metadata = {
  title: "যাকাত ক্যালকুলেটর",
  description:
    "স্বর্ণ ও রূপার নিসাব অনুযায়ী আপনার সম্পদের ২.৫% যাকাত লাইভ হিসাব করুন — নগদ, স্বর্ণ, রূপা, ব্যবসা, বিনিয়োগ ও ঋণসহ পূর্ণাঙ্গ হিসাব।",
};

const scholarlyNotes = [
  {
    icon: Hourglass,
    titleBn: "হাওল — এক বছরের শর্ত",
    titleEn: "Hawl — the One-Year Condition",
    bodyBn:
      "সাধারণত সম্পদের উপর এক চান্দ্র বছর (হাওল) অতিবাহিত হলে যাকাত ফরজ হয়। নতুন আয় ক্রমাগত যোগ হলে আহলে ইলমদের নিকট বিস্তারিত জিজ্ঞাসা করুন।",
    bodyEn:
      "Zakat normally becomes due after one lunar year (hawl) of ownership. For continuously growing income, consult qualified scholars.",
  },
  {
    icon: Scale,
    titleBn: "নিসাবের ভিত্তি",
    titleEn: "Basis of Nisab",
    bodyBn:
      "হানাফি মাযহাব অনুযায়ী রূপার নিসাব (৬১২.৩৬ গ্রাম) — এটি গরিব-দুঃখীর কল্যাণে সহজ হওয়ায় আমাদের ডিফল্ট। প্রয়োজনে স্বর্ণের নিসাব (৮৭.৪৮ গ্রাম) নির্বাচন করতে পারেন।",
    bodyEn:
      "The Hanafi school uses the silver nisab (612.36 g) — our default as it benefits the poor more. You may switch to the gold nisab (87.48 g).",
  },
  {
    icon: Coins,
    titleBn: "সঠিক বাজারদর ব্যবহার করুন",
    titleEn: "Use the Current Market Rate",
    bodyBn:
      "স্বর্ণ ও রূপার প্রতি গ্রাম দাম প্রতিদিন পরিবর্তিত হয় — হিসাবের দিনের প্রকৃত দর দিয়ে যাচাই করে নিন। ডিফল্ট মান আনুমানিক (১২,০০০/গ্রাম স্বর্ণ, ১৫০/গ্রাম রূপা)।",
    bodyEn:
      "Gold and silver prices change daily — verify with the day's actual rate. Defaults are approximate (12,000/g gold, 150/g silver).",
  },
  {
    icon: ShieldAlert,
    titleBn: "সহায়ক হাতিয়ারমাত্র",
    titleEn: "An Aid, Not a Fatwa",
    bodyBn:
      "এই ক্যালকুলেটর সাধারণ হিসাবের জন্য। ব্যবসার মজুদ, শেয়ার, কৃষিজ ফসল বা ঋণের জটিল পরিস্থিতিতে ইনস্টিটিউটের ফিকহ বোর্ডের সাথে যাচাই করুন।",
    bodyEn:
      "This calculator covers common cases. For complex situations (inventory, shares, crops, debts), verify with our fiqh board.",
  },
];

export default async function ZakatCalculatorPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  if (!(await isFeatureEnabled("donations"))) {
    return <ModuleUnavailable lang={lang} moduleLabelBn="যাকাত ক্যালকুলেটর" moduleLabelEn="Zakat calculator" />;
  }

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "যাকাত" : "Zakat"}
        title={lang === "bn" ? "যাকাত ক্যালকুলেটর" : "Zakat Calculator"}
        description={
          lang === "bn"
            ? "নগদ, স্বর্ণ, রূপা, ব্যবসা ও বিনিয়োগের পূর্ণাঙ্গ হিসাবে জানুন আপনার যাকাত কত — নিসাব অতিক্রম হলে ২.৫% যাকাত সরাসরি ফান্ডে প্রদান করুন।"
            : "Compute your exact zakat across cash, gold, silver, business, and investments — and give the 2.5% directly to the fund once nisab is exceeded."
        }
        lang={lang}
        breadcrumb={[
          { label: { bn: "সাপোর্ট করুন", en: "Support" }, href: langPath(lang, "/support") },
          { label: { bn: "যাকাত ক্যালকুলেটর", en: "Zakat Calculator" } },
        ]}
        arabicEcho="وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ"
      />

      <section className="py-14 sm:py-18" aria-label={lang === "bn" ? "যাকাত হিসাব" : "Zakat calculation"}>
        <div className="container-site">
          <ZakatCalculator lang={lang} />
        </div>
      </section>

      {/* How your zakat is spent */}
      <section className="bg-parchment py-14 sm:py-18">
        <div className="container-site">
          <Reveal className="grid items-center gap-8 rounded-2xl border bg-card p-6 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <h2 className="font-heading flex items-center gap-2.5 text-xl font-semibold">
                <HandCoins aria-hidden className="h-6 w-6 text-gold" />
                {lang === "bn" ? "আপনার যাকাত কোথায় ব্যয় হয়?" : "Where Your Zakat Goes"}
              </h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                {lang === "bn"
                  ? "যাকাত ফান্ডের প্রতিটি টাকা শুধুমাত্র যাকাত পাওয়ার যোগ্য অস্বচ্ছল শিক্ষার্থীদের ফ্রি শিক্ষা, আবাসন ও খাবারে ব্যয় হয় — প্রশাসনিক ব্যয়ে কখনোই নয়। প্রতিটি ব্যয়ের খাতভিত্তিক হিসাব সংরক্ষিত থাকে।"
                  : "Every taka of the zakat fund is spent exclusively on zakat-eligible students' free education, housing, and meals — never on administration. All spending is ledgered by category."}
              </p>
              <p className="mt-2 flex items-center gap-2 text-[13px] font-medium text-primary">
                <CalendarClock aria-hidden className="h-4 w-4 text-gold" />
                {lang === "bn"
                  ? "স্পন্সর হলে প্রতি সেমিস্টারে অগ্রগতি রিপোর্ট পাবেন"
                  : "Sponsors receive semesterly progress reports"}
              </p>
            </div>
            <Link
              href={langPath(lang, "/support?fund=zakat")}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold text-gold-foreground shadow-lg shadow-gold/25 transition-opacity hover:opacity-95"
            >
              <HandCoins aria-hidden className="h-4.5 w-4.5" />
              {lang === "bn" ? "যাকাত ফান্ডে দিন" : "Give to the Zakat Fund"}
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Scholarly notes */}
      <section className="py-14 sm:py-18" aria-label={lang === "bn" ? "গুরুত্বপূর্ণ ফিকহি নোট" : "Fiqh notes"}>
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "ফিকহি দিকনির্দেশনা" : "Fiqh Guidance"}
              title={lang === "bn" ? "হিসাবের আগে জেনে নিন" : "Know Before You Calculate"}
              lang={lang}
            />
          </Reveal>
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2">
            {scholarlyNotes.map((note) => (
              <RevealItem key={note.titleEn}>
                <article className="h-full rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <note.icon aria-hidden className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading mt-4 text-[15px] font-semibold">
                    {lang === "bn" ? note.titleBn : note.titleEn}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {lang === "bn" ? note.bodyBn : note.bodyEn}
                  </p>
                </article>
              </RevealItem>
            ))}
          </Stagger>

          <GoldRule className="mt-14" />
        </div>
      </section>
    </>
  );
}
