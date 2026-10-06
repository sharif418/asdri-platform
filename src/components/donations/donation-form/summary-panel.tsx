"use client";

import Link from "next/link";
import { Calculator, HeartHandshake, Repeat, ShieldCheck, Star, Target, X } from "lucide-react";
import { StarMotif } from "@/components/shared/ornaments";
import { PaymentChannels, type PaymentChannelInfo } from "../payment-channels";
import { formatAmount, type CampaignOption, type CurrencyCode } from "../donation-types";
import { langPath } from "@/lib/locale";
import type { FundType, Language } from "@/types";

/** The sticky aside — live summary of what the donor is about to send. */
export function DonationSummaryPanel({
  lang,
  fundType,
  fundLabel,
  numericAmount,
  currency,
  recurring,
  anonymous,
  studentRef,
  payment,
}: {
  lang: Language;
  fundType: FundType;
  fundLabel: string;
  numericAmount: number | null;
  currency: CurrencyCode;
  recurring: boolean;
  anonymous: boolean;
  studentRef: string;
  payment: PaymentChannelInfo;
}) {
  const bn = lang === "bn";
  const isSponsor = fundType === "sponsor";

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start" aria-label={bn ? "অনুদান সারসংক্ষেপ" : "Donation summary"}>
      <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-emerald-deep p-6 text-ivory shadow-lg">
        <div aria-hidden className="pattern-lattice-light absolute inset-0" />
        <div className="relative">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            <StarMotif className="h-3 w-3" />
            {bn ? "আপনার অনুদান" : "Your Donation"}
          </p>

          <p className="font-heading mt-3 break-words text-3xl font-bold text-gold">
            {numericAmount !== null && numericAmount >= 10
              ? formatAmount(numericAmount, currency, lang)
              : bn
                ? "— পরিমাণ নির্বাচন করুন"
                : "— pick an amount"}
          </p>
          <p className="mt-1 text-[13px] text-ivory/70">
            {bn ? "ফান্ড:" : "Fund:"} <span className="font-semibold text-ivory">{fundLabel}</span>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {recurring ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold">
                <Repeat aria-hidden className="h-3 w-3" />
                {bn ? "মাসিক" : "Monthly"}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ivory/20 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-ivory/80">
              {anonymous ? "Anonymous" : bn ? "নাম প্রকাশ্য" : "Named"}
            </span>
          </div>

          {isSponsor ? (
            <p className="mt-4 rounded-lg border border-ivory/15 bg-white/[0.06] p-3 text-[12px] leading-relaxed text-ivory/75">
              {studentRef.trim() ? (
                <>
                  {bn ? "নির্বাচিত শিক্ষার্থী:" : "Selected student:"}{" "}
                  <span dir="ltr" className="font-mono font-bold text-gold">
                    {studentRef.trim().toUpperCase()}
                  </span>
                </>
              ) : bn ? (
                "তালিকা থেকে শিক্ষার্থী নির্বাচন করুন বা কোড লিখুন।"
              ) : (
                "Pick a student from the list or type a code."
              )}
            </p>
          ) : null}

          {fundType === "zakat" ? (
            <p className="mt-4 rounded-lg border border-gold/30 bg-gold/10 p-3 text-[12px] leading-relaxed text-ivory/80">
              {bn
                ? "আপনার যাকাত শতভাগ যাকাত-যোগ্য অস্বচ্ছল শিক্ষার্থীদের ফ্রি শিক্ষা, আবাসন ও খাবারে ব্যয় হবে ইনশাআল্লাহ।"
                : "Your zakat will be spent entirely on zakat-eligible students' education, housing, and meals, in shaa Allah."}
              <Link
                href={langPath(lang, "/support/zakat-calculator")}
                className="mt-1.5 inline-flex items-center gap-1 font-semibold text-gold hover:underline"
              >
                <Calculator aria-hidden className="h-3.5 w-3.5" />
                {bn ? "যাকাত ক্যালকুলেটর" : "Zakat calculator"}
              </Link>
            </p>
          ) : null}

          <div className="mt-5 border-t border-ivory/15 pt-4">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-gold">
              <ShieldCheck aria-hidden className="h-4 w-4" />
              {bn ? "পেমেন্ট মাধ্যম" : "Payment channels"}
            </p>
            <div className="mt-3 text-ivory">
              <PaymentChannels lang={lang} tone="on-dark" payment={payment} />
            </div>
          </div>

          <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ivory/60">
            <HeartHandshake aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/70" />
            {bn
              ? "সকল অনুদানের হিসাব স্বচ্ছতার সাথে সংরক্ষিত হয় এবং প্রতিবেদন প্রস্তুত করা হয়।"
              : "Every donation is transparently accounted for and reported."}
          </p>
        </div>
      </div>
    </aside>
  );
}

/** Campaign targeting chip — set via ?campaign=slug (campaign card CTA). */
export function CampaignChip({
  campaign,
  lang,
  onClear,
}: {
  campaign: CampaignOption;
  lang: Language;
  onClear: () => void;
}) {
  const bn = lang === "bn";
  return (
    <div
      role="status"
      className="mt-5 flex items-center gap-2.5 rounded-xl border border-gold/40 bg-gold/[0.07] px-3.5 py-2.5"
    >
      <Target aria-hidden className="h-4 w-4 shrink-0 text-gold" />
      <p className="min-w-0 flex-1 text-[13px] leading-snug">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gold">
          {bn ? "ক্যাম্পেইন" : "Campaign"}
        </span>
        <span className="block truncate font-semibold">{campaign.title[lang]}</span>
      </p>
      <button
        type="button"
        onClick={onClear}
        aria-label={bn ? "ক্যাম্পেইন বাদ দিন" : "Remove campaign targeting"}
        title={bn ? "ক্যাম্পেইন বাদ দিন" : "Remove campaign targeting"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gold/15 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        <X aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}
