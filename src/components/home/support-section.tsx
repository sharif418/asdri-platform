import Link from "next/link";
import { ArrowRight, Calculator, Gift, GraduationCap, HandCoins, HeartHandshake, Sparkles, Target } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { ProgressBar } from "@/components/shared/progress-bar";
import { listCampaigns } from "@/lib/content/campaigns";
import { dictionaries, type DictionaryKey } from "@/lib/i18n";
import { formatCompactTaka, formatTaka } from "@/lib/format";
import { langPath } from "@/lib/locale";
import { pick } from "@/types";
import type { FundingCampaign, FundType, Language, LocalizedText } from "@/types";

interface FundCard {
  id: FundType;
  icon: typeof Gift;
  title: LocalizedText;
  description: LocalizedText;
  href: string;
}

const fundCards: FundCard[] = [
  {
    id: "zakat",
    icon: HandCoins,
    title: { bn: "যাকাত ফান্ড", en: "Zakat Fund" },
    description: {
      bn: "শতভাগ যাকাত পাওয়ার যোগ্য অস্বচ্ছল শিক্ষার্থীদের ফ্রি শিক্ষা, আবাসন ও খাবারে ব্যয় হয়।",
      en: "Spent entirely on zakat-eligible students' free education, housing, and meals.",
    },
    href: "/support?fund=zakat",
  },
  {
    id: "sponsor",
    icon: GraduationCap,
    title: { bn: "শিক্ষার্থী স্পন্সর", en: "Sponsor a Student" },
    description: {
      bn: "গোপনীয়তা-সংরক্ষিত তালিকা থেকে নির্দিষ্ট শিক্ষার্থীর পুরো বছর বা মাসের দায়িত্ব নিন।",
      en: "Take on a specific student's annual or monthly cost from the privacy-protected list.",
    },
    href: "/support?fund=sponsor",
  },
  {
    id: "general",
    icon: Gift,
    title: { bn: "সাধারণ অনুদান", en: "General Donation" },
    description: {
      bn: "ইনস্টিটিউটের উন্নয়ন, লাইব্রেরি, প্রযুক্তি খাত ও পরিচালন ব্যয়ে অবদান রাখুন।",
      en: "Contribute to institute development, library, technology, and operating costs.",
    },
    href: "/support?fund=general",
  },
  {
    id: "scholarship",
    icon: Sparkles,
    title: { bn: "স্কলারশিপ ফান্ড", en: "Scholarship Fund" },
    description: {
      bn: "মেধাবী শিক্ষার্থীদের এককালীন বা মাসিক বৃত্তি প্রদানের জন্য নিবেদিত ফান্ড।",
      en: "A dedicated fund for one-time or monthly scholarships for talented students.",
    },
    href: "/support?fund=scholarship",
  },
];

/** Track tinted for the dark parchment band — the shared server ProgressBar. */
function CampaignBar({ percent, label }: { percent: number; label: string }) {
  return <ProgressBar percent={percent} label={label} className="mt-4 bg-ivory/15" />;
}

/** Support-us band: fund categories, live campaign trackers, zakat CTA.
 *
 * Server component (round 4): campaigns are read from the DB here — the old
 * client island fetched /api/campaigns after hydration (skeleton flash,
 * empty HTML for crawlers). The progress bars are plain divs, so this whole
 * section now costs zero client JS.
 */
export async function SupportSection({ lang }: { lang: Language }) {
  const t = (key: DictionaryKey) => dictionaries[lang][key];
  const campaigns = await listCampaigns();

  return (
    <section className="relative overflow-hidden bg-emerald-deep py-16 text-ivory sm:py-24">
      <div aria-hidden className="pattern-lattice-light absolute inset-0" />
      <div className="container-site relative">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "সাপোর্ট করুন" : "Support Us"}
            title={lang === "bn" ? "দাওয়াহর অংশীদার হোন" : "Become a Partner in Dawah"}
            description={
              lang === "bn"
                ? "আপনার যাকাত, সদকা ও অনুদান দ্বীনি শিক্ষার পথে আর্থিক অনটনকে অন্তরায় হতে দেয় না — নিজেকে সদকায়ে জারিয়ার অংশীদার বানান।"
                : "Your zakat, sadaqah, and donations remove financial hardship from the path of sacred knowledge — making you a partner in ongoing charity."
            }
            lang={lang}
            tone="on-dark"
          />
        </Reveal>

        {/* Fund category cards */}
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fundCards.map((fund) => {
            const Icon = fund.icon;
            return (
              <RevealItem key={fund.id}>
                <Link
                  href={langPath(lang, fund.href)}
                  className="group flex h-full flex-col rounded-xl border border-ivory/15 bg-white/[0.06] p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-gold/60 hover:bg-white/10"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold/15 text-gold transition-transform group-hover:scale-110">
                    <Icon aria-hidden className="h-5.5 w-5.5" />
                  </span>
                  <h3 className="font-heading mt-4 text-[15px] font-semibold text-ivory group-hover:text-gold">
                    {pick(fund.title, lang)}
                  </h3>
                  <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-ivory/65">
                    {pick(fund.description, lang)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-gold">
                    {lang === "bn" ? "অনুদান দিন" : "Donate"}
                    <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </RevealItem>
            );
          })}
        </Stagger>

        {/* Live campaigns */}
        {campaigns.length > 0 ? (
          <div className="mt-12">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold">
              <Target aria-hidden className="h-4 w-4" />
              {lang === "bn" ? "চলমান ফান্ডরাইজিং ক্যাম্পেইন" : "Live Funding Campaigns"}
            </h3>
            <Stagger className="mt-4 grid gap-4 md:grid-cols-2">
              {campaigns.map((campaign: FundingCampaign) => {
                const percent = Math.min(100, Math.round((campaign.raisedAmount / campaign.targetAmount) * 100));
                return (
                  <RevealItem key={campaign.id}>
                    <div className="rounded-xl border border-ivory/15 bg-white/[0.06] p-5 backdrop-blur">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-heading text-[15px] font-semibold text-ivory">
                          {pick(campaign.title, lang)}
                        </h4>
                        <span className="shrink-0 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold">
                          {percent}%
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-1 text-[12.5px] text-ivory/60">
                        {pick(campaign.description, lang)}
                      </p>
                      <CampaignBar percent={percent} label={`${pick(campaign.title, lang)} — ${percent}%`} />
                      <div className="mt-2.5 flex items-center justify-between text-[12.5px] tabular-nums">
                        <span className="font-semibold text-gold">
                          {formatCompactTaka(campaign.raisedAmount, lang)}{" "}
                          <span className="font-normal text-ivory/55">
                            {lang === "bn" ? "সংগৃহীত" : "raised"}
                          </span>
                        </span>
                        <span className="text-ivory/55">
                          {lang === "bn" ? "লক্ষ্য" : "Target"}:{" "}
                          {formatTaka(campaign.targetAmount, lang)}
                        </span>
                      </div>
                    </div>
                  </RevealItem>
                );
              })}
            </Stagger>
          </div>
        ) : null}

        {/* Payment channels + zakat calculator CTA */}
        <Reveal className="mt-10 flex flex-col items-center justify-between gap-6 rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/10 via-transparent to-gold/10 p-6 sm:flex-row sm:p-8">
          <div className="text-center sm:text-left">
            <p className="font-heading text-lg font-semibold text-ivory">
              {lang === "bn" ? "সহজ পেমেন্ট মাধ্যম" : "Easy Payment Channels"}
            </p>
            <p className="mt-1 text-[13px] text-ivory/65">
              {lang === "bn"
                ? "বিকাশ • নগদ • রকেট • ব্যাংক ট্রান্সফার • আন্তর্জাতিক কার্ড (USD/EUR/SAR)"
                : "bKash • Nagad • Rocket • Bank transfer • International cards (USD/EUR/SAR)"}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2.5 sm:flex-row">
            <Link
              href={langPath(lang, "/support/zakat-calculator")}
              className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold transition-all hover:bg-gold hover:text-gold-foreground"
            >
              <Calculator aria-hidden className="h-4 w-4" />
              {lang === "bn" ? "যাকাত ক্যালকুলেটর" : "Zakat Calculator"}
            </Link>
            <Link
              href={langPath(lang, "/support")}
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-lg shadow-black/20 transition-opacity hover:opacity-95"
            >
              <HeartHandshake aria-hidden className="h-4 w-4" />
              {t("action.donate")}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
