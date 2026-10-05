import { CURRENCY_VALUES } from "@/lib/validators";
import { formatNumber } from "@/lib/format";
import type { FundType, Language } from "@/types";

/** Currency codes accepted by the donation API (mirrors zod `CURRENCY_VALUES`). */
export type CurrencyCode = (typeof CURRENCY_VALUES)[number];

export const CURRENCY_OPTIONS: { value: CurrencyCode; labelBn: string; labelEn: string }[] = [
  { value: "BDT", labelBn: "৳ বাংলাদেশি টাকা (BDT)", labelEn: "৳ Bangladeshi Taka (BDT)" },
  { value: "USD", labelBn: "$ মার্কিন ডলার (USD)", labelEn: "$ US Dollar (USD)" },
  { value: "EUR", labelBn: "€ ইউরো (EUR)", labelEn: "€ Euro (EUR)" },
  { value: "SAR", labelBn: "﷼ সৌদি রিয়াল (SAR)", labelEn: "﷼ Saudi Riyal (SAR)" },
];

/** Format a donation amount with the currency symbol and Bengali digits (bn). */
export function formatAmount(amount: number, currency: CurrencyCode, lang: Language): string {
  const n = formatNumber(Math.round(amount), lang);
  switch (currency) {
    case "USD":
      return `$${n}`;
    case "EUR":
      return `€${n}`;
    case "SAR":
      return `${n} ﷼`;
    default:
      return `৳${n}`;
  }
}

export const FUND_LABELS: Record<FundType, { bn: string; en: string }> = {
  zakat: { bn: "যাকাত ফান্ড", en: "Zakat Fund" },
  sponsor: { bn: "শিক্ষার্থী স্পন্সর", en: "Sponsor a Student" },
  general: { bn: "সাধারণ অনুদান", en: "General Donation" },
  scholarship: { bn: "স্কলারশিপ ফান্ড", en: "Scholarship Fund" },
};

/** Payment channel info returned by POST /api/donations. */
export interface PaymentInfo {
  bkash: string;
  nagad: string;
  rocket: string;
  bank: string;
}

/** Receipt payload rendered in the post-submit success dialog. */
export interface ReceiptData {
  receiptNo: string;
  fundType: FundType;
  amount: number;
  currency: CurrencyCode;
  donorName: string;
  email: string;
  anonymous: boolean;
  recurring: boolean;
  createdAt: string;
  paymentInfo: PaymentInfo;
  message: string;
  /** Signed sandbox gateway link (null when a real gateway is configured). */
  checkoutUrl: string | null;
}

const BN_DIGIT_MAP = "০১২৩৪৫৬৭৮৯";

/**
 * Parse a user-typed amount that may contain Bengali digits, commas, or
 * spaces. Returns a positive finite number or `null`.
 */
export function parseAmount(raw: string): number | null {
  const normalized = raw
    .replace(/[০-৯]/g, (d) => String(BN_DIGIT_MAP.indexOf(d)))
    .replace(/[,]/g, "")
    .trim();
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}
