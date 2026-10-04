"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, HeartHandshake, Info } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { langPath } from "@/lib/locale";
import type { Language } from "@/types";
import { cn } from "@/lib/utils";

export interface ZakatBreakdownRow {
  id: string;
  label: string;
  display: string;
  emphasize?: boolean;
  negative?: boolean;
}

export type NisabBasis = "silver" | "gold";

interface ZakatResultProps {
  lang: Language;
  netWealth: number;
  nisab: number;
  nisabBasis: NisabBasis;
  zakatDue: number;
  isDue: boolean;
  breakdown: ZakatBreakdownRow[];
}

/** Live-computed zakat result panel: status, amount, and full breakdown. */
export function ZakatResult({ lang, netWealth, nisab, nisabBasis, zakatDue, isDue, breakdown }: ZakatResultProps) {
  const bn = lang === "bn";
  const fmt = (value: number) => `৳${formatNumber(Math.round(value), lang)}`;
  const zakatAmount = Math.ceil(zakatDue);

  return (
    <div className="flex flex-col gap-5">
      {/* Status verdict */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-6 text-ivory shadow-lg",
          isDue ? "bg-emerald-deep" : "bg-amber-700/90 dark:bg-amber-900/80",
        )}
      >
        <div aria-hidden className="pattern-lattice-light absolute inset-0" />
        <div className="relative">
          {isDue ? (
            <>
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                <CheckCircle2 aria-hidden className="h-4 w-4" />
                {bn ? "যাকাত ফরজ হয়েছে" : "Zakat is Due"}
              </p>
              <p className="font-heading mt-3 break-words text-4xl font-bold text-gold">{fmt(zakatDue)}</p>
              <p className="mt-1.5 text-[13px] text-ivory/75">
                {bn
                  ? "নিট সম্পদের ২.৫% (নিসাব অতিক্রম হয়েছে)"
                  : "2.5% of net wealth (nisab exceeded)"}
              </p>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/90">
                <AlertCircle aria-hidden className="h-4 w-4" />
                {bn ? "যাকাত ফরজ নয়" : "Zakat Not Due"}
              </p>
              <p className="font-heading mt-3 text-2xl font-bold leading-snug">
                {bn ? "আপনার সম্পদ নিসাব পরিমাণে পৌঁছায়নি" : "Your wealth has not reached nisab"}
              </p>
              <p className="mt-1.5 text-[13px] text-ivory/80">
                {bn ? "নিসাব (রূপার ভিত্তিতে): " : "Nisab (silver basis): "}
                {fmt(nisab)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold">
          <Info aria-hidden className="h-4 w-4 text-gold" />
          {bn ? "হিসাবের বিবরণ" : "Calculation Breakdown"}
        </h3>
        <dl className="mt-4 divide-y divide-dashed">
          {breakdown.map((row) => (
            <div key={row.id} className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <dt className={cn("text-[13px]", row.emphasize ? "font-bold" : "text-muted-foreground")}>{row.label}</dt>
              <dd
                dir="ltr"
                className={cn(
                  "font-mono text-[13px] font-semibold tabular-nums",
                  row.negative && "text-rose-600 dark:text-rose-400",
                  row.emphasize && "text-base font-bold text-primary",
                )}
              >
                {row.display}
              </dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="text-[13px] font-bold">
              {bn ? "নিসাব সীমা" : "Nisab threshold"}
              <span className="ml-1.5 rounded-full bg-gold/10 px-2 py-0.5 text-[10.5px] font-semibold text-gold">
                {nisabBasis === "silver" ? (bn ? "রূপা" : "Silver") : bn ? "স্বর্ণ" : "Gold"}
              </span>
            </dt>
            <dd dir="ltr" className="font-mono text-[13px] font-semibold tabular-nums">
              {fmt(nisab)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="text-[13px] font-bold">{bn ? "নিট সম্পদ" : "Net wealth"}</dt>
            <dd dir="ltr" className="font-mono text-[13px] font-semibold tabular-nums">
              {fmt(netWealth)}
            </dd>
          </div>
        </dl>
      </div>

      {/* CTA */}
      {isDue ? (
        <Link
          href={langPath(lang, `/support?fund=zakat&amount=${zakatAmount}`)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-6 py-3.5 text-[15px] font-bold text-gold-foreground shadow-lg shadow-gold/25 transition-opacity hover:opacity-95"
        >
          <HeartHandshake aria-hidden className="h-4.5 w-4.5" />
          {bn ? "এই পরিমাণ যাকাত ফান্ডে দিন" : "Give This Amount to the Zakat Fund"}
        </Link>
      ) : (
        <Link
          href={langPath(lang, "/support?fund=general")}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[15px] font-bold text-primary-foreground shadow-lg transition-opacity hover:opacity-95"
        >
          <HeartHandshake aria-hidden className="h-4.5 w-4.5" />
          {bn ? "তবুও স্বেচ্ছায় সদকা দিন" : "Give Voluntary Sadaqah Instead"}
        </Link>
      )}

      <p className="text-center text-[11.5px] leading-relaxed text-muted-foreground">
        {bn
          ? "হিসাব সম্পূর্ণ আপনার ব্রাউজারেই হয় — কোনো তথ্য সার্ভারে সংরক্ষিত হয় না।"
          : "The calculation runs entirely in your browser — nothing is stored on our servers."}
      </p>
    </div>
  );
}
