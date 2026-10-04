import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Calculator, FileSpreadsheet, GraduationCap, LayoutDashboard, ShieldCheck } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { GoldRule } from "@/components/shared/ornaments";
import { DonationPortal } from "@/components/donations/donation-portal";
import { CampaignsSection } from "@/components/donations/campaigns-section";
import { PaymentChannels } from "@/components/donations/payment-channels";
import { FUND_TYPES } from "@/types";
import type { FundType } from "@/types";
import { getFunds, getFundLabels } from "@/lib/content/funds";

export const metadata: Metadata = {
  title: "সাপোর্ট করুন — অনুদান পোর্টাল",
  description:
    "যাকাত ফান্ড, শিক্ষার্থী স্পন্সর, সাধারণ অনুদান ও স্কলারশিপ ফান্ডে অবদান রাখুন — বিকাশ, নগদ, রকেট ও ব্যাংক ট্রান্সফারে সহজ পেমেন্ট।",
};

interface SupportPageProps {
  params: Promise<{ lang: Lang }>;
  searchParams: Promise<{ fund?: string; amount?: string }>;
}

/** Transparency pillars — how the institute safeguards every taka. */
const transparencyItems = [
  {
    icon: ShieldCheck,
    titleBn: "যাকাতের শতভাগ সুরক্ষা",
    titleEn: "100% Zakat Integrity",
    bodyBn:
      "যাকাত ফান্ডের প্রতিটি টাকা শুধুমাত্র যাকাত পাওয়ার যোগ্য অস্বচ্ছল শিক্ষার্থীদের ফ্রি শিক্ষা, আবাসন ও খাবারে ব্যয় হয় — প্রশাসনিক খাতে কখনোই নয়।",
    bodyEn:
      "Every taka of the zakat fund is spent exclusively on zakat-eligible students' free education, housing, and meals — never on administration.",
  },
  {
    icon: GraduationCap,
    titleBn: "সেমিস্টারভিত্তিক স্পন্সর ট্র্যাকিং",
    titleEn: "Semesterly Sponsor Tracking",
    bodyBn:
      "আপনি যে শিক্ষার্থী স্পন্সর করেছেন, প্রতি সেমিস্টারে তার একাডেমিক অগ্রগতি, ফলাফল ও আর্থিক ব্যয়ের রিপোর্ট ইমেইলে পাঠানো হয়।",
    bodyEn:
      "Sponsors receive semesterly email reports covering the sponsored student's academic progress, results, and expense breakdown.",
  },
  {
    icon: LayoutDashboard,
    titleBn: "ডোনার ড্যাশবোর্ড",
    titleEn: "Donor Dashboard",
    bodyBn:
      "অ্যাকাউন্টে লগইন করে আপনার সকল অনুদানের রিসিপ্ট নম্বর, পরিমাণ, ফান্ড ও স্ট্যাটাস এক জায়গায় দেখুন।",
    bodyEn:
      "Log in to your account to view every donation — receipt numbers, amounts, funds, and statuses in one place.",
  },
  {
    icon: FileSpreadsheet,
    titleBn: "খাতভিত্তিক হিসাব সংরক্ষণ",
    titleEn: "Audited Ledger Keeping",
    bodyBn:
      "সকল আয়-ব্যয়ের খাতভিত্তিক হিসাব সংরক্ষিত থাকে এবং বছর শেষে আর্থিক প্রতিবেদন প্রকাশ করা হয়।",
    bodyEn:
      "All income and expenses are ledgered by category, with annual financial reports published at year end.",
  },
];

export default async function SupportPage({ params, searchParams }: SupportPageProps) {
  const { lang } = await params;
  if (!(await isFeatureEnabled("donations"))) {
    return <ModuleUnavailable lang={lang} moduleLabelBn="অনুদান" moduleLabelEn="Donations" />;
  }
  const sp = await searchParams;

  const fund = FUND_TYPES.includes(sp.fund as FundType) ? (sp.fund as FundType) : "zakat";
  const parsedAmount = Number(sp.amount);
  const initialAmount =
    Number.isFinite(parsedAmount) && parsedAmount >= 10 && parsedAmount <= 10_000_000
      ? Math.round(parsedAmount)
      : null;

  const [funds, fundLabels] = await Promise.all([getFunds(), getFundLabels()]);

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "সাপোর্ট করুন" : "Support Us"}
        title={lang === "bn" ? "অনুদান ও সদকা পোর্টাল" : "Donation & Sadaqah Portal"}
        description={
          lang === "bn"
            ? "আপনার যাকাত, সদকা ও অনুদান দ্বীনি শিক্ষার পথ থেকে আর্থিক অনটন দূর করে — নিজেকে সদকায়ে জারিয়ার অংশীদার বানান। ফান্ড বেছে নিন, রিসিপ্ট নিন, স্বচ্ছতার সাথে ট্র্যাক করুন।"
            : "Your zakat, sadaqah, and donations remove financial hardship from the path of sacred knowledge — making you a partner in ongoing charity. Choose a fund, get a receipt, and track it transparently."
        }
        lang={lang}
        breadcrumb={[{ label: { bn: "সাপোর্ট করুন", en: "Support" } }]}
        arabicEcho="مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا فَيُضَاعِفَهُ لَهُ"
      />

      {/* Fund selector + donation form + receipt dialog */}
      <DonationPortal initialFund={fund} initialAmount={initialAmount} lang={lang} funds={funds} fundLabels={fundLabels} />

      {/* Live campaigns */}
      <CampaignsSection lang={lang} />

      {/* Transparency */}
      <section className="py-16 sm:py-20" aria-label={lang === "bn" ? "স্বচ্ছতা" : "Transparency"}>
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow={lang === "bn" ? "স্বচ্ছতা ও জবাবদিহি" : "Transparency & Accountability"}
              title={lang === "bn" ? "আপনার আমানত, আমাদের দায়িত্ব" : "Your Trust, Our Duty"}
              description={
                lang === "bn"
                  ? "দাতা�ীন কোনো টাকা অনির্দিষ্ট খাতে ব্যয় হয় না — প্রতিটি অনুদান নির্দিষ্ট ফান্ডে জমা হয় এবং খাতভিত্তিক হিসাবে সংরক্ষিত থাকে।"
                  : "Not a single taka is diverted — every donation is credited to its designated fund and kept in a categorized ledger."
              }
              lang={lang}
            />
          </Reveal>

          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {transparencyItems.map((item) => (
              <RevealItem key={item.titleEn}>
                <article className="h-full rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon aria-hidden className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading mt-4 text-[15px] font-semibold">
                    {lang === "bn" ? item.titleBn : item.titleEn}
                  </h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    {lang === "bn" ? item.bodyBn : item.bodyEn}
                  </p>
                </article>
              </RevealItem>
            ))}
          </Stagger>

          {/* Payment channels + donor dashboard */}
          <Reveal className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <h3 className="font-heading flex items-center gap-2.5 text-lg font-semibold">
                <BookOpenCheck aria-hidden className="h-5 w-5 text-gold" />
                {lang === "bn" ? "অফিসিয়াল পেমেন্ট মাধ্যম" : "Official Payment Channels"}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {lang === "bn"
                  ? "নিচের নম্বরগুলো ছাড়া অন্য কোনো অ্যাকাউন্টে অনুদান পাঠাবেন না। পেমেন্টের সময় রেফারেন্সে আপনার রিসিপ্ট নম্বর উল্লেখ করুন।"
                  : "Only send donations to the accounts below. Always mention your receipt number as the payment reference."}
              </p>
              <div className="mt-5">
                <PaymentChannels lang={lang} />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-emerald-deep p-6 text-ivory sm:p-8">
              <div aria-hidden className="pattern-lattice-light absolute inset-0" />
              <div className="relative">
                <h3 className="font-heading text-lg font-semibold">
                  {lang === "bn" ? "ডোনার ড্যাশবোর্ড" : "Donor Dashboard"}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ivory/75">
                  {lang === "bn"
                    ? "অ্যাকাউন্টে লগইন করে আপনার সকল অনুদানের রিসিপ্ট, স্ট্যাটাস ও স্পন্সর রিপোর্ট এক জায়গায় দেখুন।"
                    : "Log in to view all your donation receipts, statuses, and sponsor reports in one place."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={langPath(lang, "/account")}
                    className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-lg shadow-black/20 transition-opacity hover:opacity-95"
                  >
                    <LayoutDashboard aria-hidden className="h-4 w-4" />
                    {lang === "bn" ? "ড্যাশবোর্ড দেখুন" : "Open Dashboard"}
                  </Link>
                  <Link
                    href={langPath(lang, "/login")}
                    className="inline-flex items-center gap-2 rounded-full border border-ivory/25 px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:border-gold hover:text-gold"
                  >
                    {lang === "bn" ? "লগইন" : "Login"}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Zakat calculator CTA */}
      <section className="relative overflow-hidden bg-emerald-deep py-14 text-ivory sm:py-16">
        <div aria-hidden className="pattern-lattice-light absolute inset-0" />
        <div className="container-site relative">
          <Reveal className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <GoldRule tone="on-dark" className="justify-start" />
              <h2 className="font-heading mt-4 text-2xl font-semibold sm:text-3xl">
                {lang === "bn" ? "যাকাত নির্ভুলভাবে হিসাব করুন" : "Calculate Your Zakat Precisely"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ivory/70">
                {lang === "bn"
                  ? "স্বর্ণ-রূপার নিসাব অনুযায়ী সম্পদের হিসাব করে ২.৫% যাকাত নির্ধারণ করুন — সরাসরি যাকাত ফান্ডে প্রদান করুন।"
                  : "Compute your 2.5% zakat against the gold/silver nisab and give it straight to the zakat fund."}
              </p>
            </div>
            <Link
              href={langPath(lang, "/support/zakat-calculator")}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold text-gold-foreground shadow-lg shadow-black/20 transition-opacity hover:opacity-95"
            >
              <Calculator aria-hidden className="h-4.5 w-4.5" />
              {lang === "bn" ? "যাকাত ক্যালকুলেটর খুলুন" : "Open Zakat Calculator"}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
