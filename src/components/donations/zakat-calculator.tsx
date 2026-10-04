"use client";

import { useMemo, useState } from "react";
import { Coins, Gem, Landmark, PiggyBank, RotateCcw, Scale, TrendingUp, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { parseAmount } from "./donation-types";
import { ZakatResult, type ZakatBreakdownRow, type NisabBasis } from "./zakat-result";
import type { Language, LocalizedText } from "@/types";
import { pick } from "@/types";

/* ————————— Fiqh constants ————————— */
export const GOLD_NISAB_GRAMS = 87.48; // 7.5 tola = 87.48 g
export const SILVER_NISAB_GRAMS = 612.36; // 52.5 tola = 612.36 g
const ZAKAT_RATE = 0.025; // 2.5%
const DEFAULT_GOLD_PRICE = 12000; // BDT per gram
const DEFAULT_SILVER_PRICE = 150; // BDT per gram

interface ZakatCalculatorProps {
  lang: Language;
}

/** Stable pure helper: raw string → non-negative number. */
const toNum = (raw: string): number => parseAmount(raw) ?? 0;

interface FieldConfig {
  id: keyof ZakatFields;
  icon: typeof Wallet;
  label: LocalizedText;
  hint: LocalizedText;
  placeholder?: string;
}

interface ZakatFields {
  cash: string;
  goldGrams: string;
  goldPrice: string;
  silverGrams: string;
  silverPrice: string;
  business: string;
  investments: string;
  other: string;
  liabilities: string;
}

const INITIAL_FIELDS: ZakatFields = {
  cash: "",
  goldGrams: "",
  goldPrice: String(DEFAULT_GOLD_PRICE),
  silverGrams: "",
  silverPrice: String(DEFAULT_SILVER_PRICE),
  business: "",
  investments: "",
  other: "",
  liabilities: "",
};

const assetSteps: { title: LocalizedText; caption: LocalizedText; fields: FieldConfig[] }[] = [
  {
    title: { bn: "নগদ ও ব্যাংক জমা", en: "Cash & Bank Deposits" },
    caption: { bn: "মানিব্যাগ, ব্যাংক ও মোবাইল ব্যাংকিং অ্যাকাউন্টের সব প্রকার নগদ টাকা", en: "All liquid money in wallets, bank and mobile accounts" },
    fields: [
      { id: "cash", icon: Wallet, label: { bn: "নগদ টাকা ও ব্যাংক জমা", en: "Cash & bank balance" }, hint: { bn: "৳", en: "৳" } },
    ],
  },
  {
    title: { bn: "স্বর্ণ ও রূপা", en: "Gold & Silver" },
    caption: {
      bn: "ভর লিখুন — প্রতি গ্রামের বর্তমান দাম অনুযায়ী মূল্য হিসাব হবে",
      en: "Enter weight — valued at the current per-gram rate",
    },
    fields: [
      { id: "goldGrams", icon: Gem, label: { bn: "স্বর্ণ (গ্রাম)", en: "Gold (grams)" }, hint: { bn: "গ্রাম", en: "g" } },
      { id: "goldPrice", icon: Coins, label: { bn: "স্বর্ণের দাম (প্রতি গ্রাম)", en: "Gold price (per gram)" }, hint: { bn: "৳/গ্রাম", en: "৳/g" } },
      { id: "silverGrams", icon: Gem, label: { bn: "রূপা (গ্রাম)", en: "Silver (grams)" }, hint: { bn: "গ্রাম", en: "g" } },
      { id: "silverPrice", icon: Coins, label: { bn: "রূপার দাম (প্রতি গ্রাম)", en: "Silver price (per gram)" }, hint: { bn: "৳/গ্রাম", en: "৳/g" } },
    ],
  },
  {
    title: { bn: "ব্যবসা ও বিনিয়োগ", en: "Business & Investments" },
    caption: {
      bn: "বিক্রয়যোগ্য মজুদ পণ্যের বাজারমূল্য, শেয়ার, ফিক্সড ডিপোজিট ইত্যাদি",
      en: "Market value of trade inventory, shares, FDRs, etc.",
    },
    fields: [
      { id: "business", icon: Landmark, label: { bn: "ব্যবসার পণ্যের মূল্য", en: "Business goods value" }, hint: { bn: "৳", en: "৳" } },
      { id: "investments", icon: TrendingUp, label: { bn: "বিনিয়োগ / শেয়ার", en: "Investments / shares" }, hint: { bn: "৳", en: "৳" } },
      { id: "other", icon: PiggyBank, label: { bn: "অন্যান্য সম্পদ", en: "Other assets" }, hint: { bn: "৳", en: "৳" } },
    ],
  },
];

/** Bilingual zakat calculator — live 2.5% computation against gold/silver nisab. */
export function ZakatCalculator({ lang }: ZakatCalculatorProps) {
  const bn = lang === "bn";
  const [fields, setFields] = useState<ZakatFields>(INITIAL_FIELDS);
  const [nisabBasis, setNisabBasis] = useState<NisabBasis>("silver");

  const setField = (id: keyof ZakatFields, value: string) =>
    setFields((prev) => ({ ...prev, [id]: value }));

  const result = useMemo(() => {
    const goldValue = toNum(fields.goldGrams) * toNum(fields.goldPrice);
    const silverValue = toNum(fields.silverGrams) * toNum(fields.silverPrice);
    const assets =
      toNum(fields.cash) + goldValue + silverValue + toNum(fields.business) + toNum(fields.investments) + toNum(fields.other);
    const liabilities = toNum(fields.liabilities);
    const netWealth = assets - liabilities;
    const zakatBase = Math.max(0, netWealth);

    const silverNisab = SILVER_NISAB_GRAMS * toNum(fields.silverPrice);
    const goldNisab = GOLD_NISAB_GRAMS * toNum(fields.goldPrice);
    const nisab = nisabBasis === "silver" ? silverNisab : goldNisab;

    const isDue = netWealth >= nisab && netWealth > 0;
    const zakatDue = isDue ? zakatBase * ZAKAT_RATE : 0;

    return { goldValue, silverValue, assets, liabilities, netWealth, nisab, isDue, zakatDue };
  }, [fields, nisabBasis]);

  const fmt = (value: number) => `৳${formatNumber(Math.round(value), lang)}`;

  const breakdown: ZakatBreakdownRow[] = [
    { id: "cash", label: bn ? "নগদ ও ব্যাংক জমা" : "Cash & bank", display: fmt(toNum(fields.cash)) },
    {
      id: "gold",
      label: bn
        ? `স্বর্ণ (${formatNumber(toNum(fields.goldGrams), lang)} গ্রাম)`
        : `Gold (${formatNumber(toNum(fields.goldGrams), lang)} g)`,
      display: fmt(result.goldValue),
    },
    {
      id: "silver",
      label: bn
        ? `রূপা (${formatNumber(toNum(fields.silverGrams), lang)} গ্রাম)`
        : `Silver (${formatNumber(toNum(fields.silverGrams), lang)} g)`,
      display: fmt(result.silverValue),
    },
    { id: "business", label: bn ? "ব্যবসার পণ্য" : "Business goods", display: fmt(toNum(fields.business)) },
    { id: "investments", label: bn ? "বিনিয়োগ / শেয়ার" : "Investments", display: fmt(toNum(fields.investments)) },
    { id: "other", label: bn ? "অন্যান্য সম্পদ" : "Other assets", display: fmt(toNum(fields.other)) },
    {
      id: "assets-total",
      label: bn ? "মোট সম্পদ" : "Total assets",
      display: fmt(result.assets),
      emphasize: true,
    },
    {
      id: "liabilities",
      label: bn ? "ঋণ ও দেনা (বিয়োগ)" : "Debts (deducted)",
      display: `− ${fmt(result.liabilities)}`,
      negative: true,
    },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* ——— Input steps ——— */}
      <div className="space-y-6">
        {assetSteps.map((step, stepIndex) => (
          <fieldset key={step.title.en} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <legend className="flex items-center gap-2.5 px-1 text-[14px] font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-[12px] font-bold text-gold">
                {formatNumber(stepIndex + 1, lang)}
              </span>
              {pick(step.title, lang)}
            </legend>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{pick(step.caption, lang)}</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {step.fields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={`zakat-${field.id}`} className="flex items-center gap-1.5 text-[13px]">
                    <field.icon aria-hidden className="h-3.5 w-3.5 text-gold" />
                    {pick(field.label, lang)}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`zakat-${field.id}`}
                      dir="ltr"
                      inputMode="decimal"
                      value={fields[field.id]}
                      onChange={(e) => setField(field.id, e.target.value)}
                      placeholder={field.placeholder ?? "0"}
                      className="pr-16 font-mono text-[14px] tabular-nums"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                      {pick(field.hint, lang)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        ))}

        {/* Step: liabilities */}
        <fieldset className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <legend className="flex items-center gap-2.5 px-1 text-[14px] font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-[12px] font-bold text-gold">
              {formatNumber(4, lang)}
            </span>
            {bn ? "ঋণ ও দেনা" : "Debts & Liabilities"}
          </legend>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {bn
              ? "যাকাতের হিসাবের সময় পরিশোধযোগ্য ঋণ (ব্যক্তিগত ও ব্যবসায়িক) সম্পদ থেকে বাদ যায়।"
              : "Payable debts (personal and business) are deducted from your zakatable wealth."}
          </p>
          <div className="mt-4 max-w-sm space-y-1.5">
            <Label htmlFor="zakat-liabilities" className="text-[13px]">
              {bn ? "মোট ঋণ ও দেনা" : "Total debts"}
            </Label>
            <div className="relative max-w-56">
              <Input
                id="zakat-liabilities"
                dir="ltr"
                inputMode="decimal"
                value={fields.liabilities}
                onChange={(e) => setField("liabilities", e.target.value)}
                placeholder="0"
                className="pr-6 font-mono text-[14px] tabular-nums"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                ৳
              </span>
            </div>
          </div>
        </fieldset>

        {/* Step: nisab basis */}
        <fieldset className="rounded-2xl border border-gold/40 bg-gold/[0.05] p-5 shadow-sm sm:p-6">
          <legend className="flex items-center gap-2.5 px-1 text-[14px] font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-[12px] font-bold text-gold">
              {formatNumber(5, lang)}
            </span>
            {bn ? "নিসাবের ভিত্তি নির্বাচন" : "Choose the Nisab Basis"}
          </legend>
          <RadioGroup
            value={nisabBasis}
            onValueChange={(v) => setNisabBasis(v as NisabBasis)}
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <Label
              htmlFor="nisab-silver"
              className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 transition-all has-[button[data-state=checked]]:border-gold/70 has-[button[data-state=checked]]:ring-2 has-[button[data-state=checked]]:ring-gold/30"
            >
              <RadioGroupItem id="nisab-silver" value="silver" className="mt-0.5" />
              <span>
                <span className="block text-[13.5px] font-semibold">
                  {bn ? "রূপার নিসাব (হানাফি অবস্থান)" : "Silver nisab (Hanafi position)"}
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-muted-foreground">
                  {bn ? `${formatNumber(SILVER_NISAB_GRAMS, lang)} গ্রাম রূপার বাজারদর` : `${formatNumber(SILVER_NISAB_GRAMS, lang)} g of silver`}
                  {" = "}
                  {fmt(SILVER_NISAB_GRAMS * toNum(fields.silverPrice))}
                </span>
              </span>
            </Label>
            <Label
              htmlFor="nisab-gold"
              className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 transition-all has-[button[data-state=checked]]:border-gold/70 has-[button[data-state=checked]]:ring-2 has-[button[data-state=checked]]:ring-gold/30"
            >
              <RadioGroupItem id="nisab-gold" value="gold" className="mt-0.5" />
              <span>
                <span className="block text-[13.5px] font-semibold">
                  {bn ? "স্বর্ণের নিসাব" : "Gold nisab"}
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-muted-foreground">
                  {bn ? `${formatNumber(GOLD_NISAB_GRAMS, lang)} গ্রাম স্বর্ণের বাজারদর` : `${formatNumber(GOLD_NISAB_GRAMS, lang)} g of gold`}
                  {" = "}
                  {fmt(GOLD_NISAB_GRAMS * toNum(fields.goldPrice))}
                </span>
              </span>
            </Label>
          </RadioGroup>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFields(INITIAL_FIELDS);
              setNisabBasis("silver");
            }}
            className="mt-5 gap-2 text-[13px]"
          >
            <RotateCcw aria-hidden className="h-3.5 w-3.5" />
            {bn ? "ফর্ম রিসেট করুন" : "Reset the form"}
          </Button>
        </fieldset>
      </div>

      {/* ——— Live result ——— */}
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label={bn ? "যাকাতের ফলাফল" : "Zakat result"}>
        <div className="mb-4 flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
          <Scale aria-hidden className="h-4 w-4 text-gold" />
          {bn ? "হিসাব লাইভ হালনাগাদ হয়" : "Results update live as you type"}
        </div>
        <ZakatResult
          lang={lang}
          netWealth={result.netWealth}
          nisab={result.nisab}
          nisabBasis={nisabBasis}
          zakatDue={result.zakatDue}
          isDue={result.isDue}
          breakdown={breakdown}
        />
      </aside>
    </div>
  );
}
