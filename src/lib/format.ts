import type { Language } from "@/types";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

/** Convert Latin digits in a string/number to Bengali digits. */
export function toBnDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function formatNumber(value: number, lang: Language): string {
  const formatted = new Intl.NumberFormat("en-US").format(value);
  return lang === "bn" ? toBnDigits(formatted) : formatted;
}

/** Format a BDT amount with Bengali digits and ৳ symbol when lang=bn. */
export function formatTaka(amount: number, lang: Language): string {
  const formatted = new Intl.NumberFormat("en-US").format(Math.round(amount));
  return lang === "bn" ? `৳${toBnDigits(formatted)}` : `৳${formatted}`;
}

export function formatCompactTaka(amount: number, lang: Language): string {
  if (amount >= 100000) {
    const lakh = (amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1);
    return lang === "bn" ? `৳${toBnDigits(lakh)} লক্ষ` : `৳${lakh}L`;
  }
  if (amount >= 1000) {
    const k = (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1);
    return lang === "bn" ? `৳${toBnDigits(k)} হাজার` : `৳${k}K`;
  }
  return formatTaka(amount, lang);
}

const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
] as const;

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Format an ISO date as "১৫ জানুয়ারি ২০২৫" (bn) or "15 January 2025" (en). */
export function formatDate(iso: string | Date, lang: Language): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  const year = date.getFullYear();
  if (lang === "bn") {
    return `${toBnDigits(day)} ${BN_MONTHS[date.getMonth()]} ${toBnDigits(year)}`;
  }
  return `${day} ${EN_MONTHS[date.getMonth()]} ${year}`;
}

/** Relative "days ago" label for notice freshness. */
export function daysAgoLabel(iso: string | Date, lang: Language): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return lang === "bn" ? "আজ" : "Today";
  if (days === 1) return lang === "bn" ? "গতকাল" : "Yesterday";
  return lang === "bn" ? `${toBnDigits(days)} দিন আগে` : `${days} days ago`;
}

/** Is a notice "new"? (published within the last 14 days) */
export function isNewNotice(iso: string | Date): boolean {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return Date.now() - date.getTime() < 14 * 86400000;
}

/** Format an ISO date as "জানুয়ারি ২০২৫" (bn) or "January 2025" (en) — archive headers. */
export function formatMonthYear(iso: string | Date, lang: Language): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  if (lang === "bn") return `${BN_MONTHS[date.getMonth()]} ${toBnDigits(year)}`;
  return `${EN_MONTHS[date.getMonth()]} ${year}`;
}

/** Estimated reading time in minutes for a body of text. */
export function readMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}

/** Human file size: "৩৪.২ KB" / "1.9 MB" (admin library + audit). */
export function formatBytes(bytes: number, lang: Language): string {
  if (bytes <= 0) return lang === "bn" ? "০ B" : "0 B";
  if (bytes < 1024) return `${lang === "bn" ? toBnDigits(bytes) : bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = (bytes / 1024).toFixed(bytes / 1024 >= 100 ? 0 : 1);
    return `${lang === "bn" ? toBnDigits(kb) : kb} KB`;
  }
  const mb = (bytes / 1024 / 1024).toFixed(1);
  return `${lang === "bn" ? toBnDigits(mb) : mb} MB`;
}

/** Normalise a numeric input: Bengali digits → Latin, non-digits stripped.
 *  Admin number fields (seats, scores, amounts) use this so typing ৪০ works. */
export function normalizeDigitsInput(value: string): string {
  const latin = value.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  return latin.replace(/[^0-9]/g, "");
}
