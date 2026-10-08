import { toBnDigits } from "@/lib/format";

/**
 * Bengali (Bangla) calendar math — pure functions, UTC-anchored so timezone
 * drift can never move a day across a boundary. Implements the 2019-revised
 * Bangladesh calendar: Boishakh 1 is always April 14; months Boishakh–Ashwin
 * carry 31 days, Kartik–Magh 30, Falgun 29 (30 when the season's February is
 * a Gregorian leap February), Choitro 30.
 *
 * The picker commits Gregorian "YYYY-MM-DD" wire values (unchanged wire
 * format); this module only describes how those days read in the Bangla
 * calendar, so the officer sees বৈশাখ–চৈত্র, not an alien month list.
 */

export const BENGALI_MONTHS_BN = [
  "বৈশাখ",
  "জ্যৈষ্ঠ",
  "আষাঢ়",
  "শ্রাবণ",
  "ভাদ্র",
  "আশ্বিন",
  "কার্তিক",
  "অগ্রহায়ণ",
  "পৌষ",
  "মাঘ",
  "ফাল্গুন",
  "চৈত্র",
] as const;

/** Sun-first week (the Bangladesh convention). */
export const BENGALI_WEEKDAYS_SHORT = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"] as const;
export const BENGALI_WEEKDAYS_LONG = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
] as const;

export interface BengaliDate {
  year: number; // বঙ্গাব্দ, e.g. 1432
  month: number; // 1–12 (Boishakh … Choitro)
  day: number; // 1–31
}

/** Is the Gregorian year a leap year? */
export function isGregorianLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Days in a Bengali month. Falgun (11) is 30 when its February is a leap
 * February — Falgun of বঙ্গাব্দ Y falls in February of Gregorian Y + 594.
 */
export function bengaliMonthLength(bengaliYear: number, month: number): number {
  if (month >= 1 && month <= 6) return 31; // বৈশাখ–আশ্বিন
  if (month >= 7 && month <= 10) return 30; // কার্তিক–মাঘ
  if (month === 11) return isGregorianLeap(bengaliYear + 594) ? 30 : 29; // ফাল্গুন
  return 30; // চৈত্র
}

/** Total days in a Bengali year (365, or 366 when Falgun carries the leap day). */
export function bengaliYearLength(bengaliYear: number): number {
  let sum = 0;
  for (let month = 1; month <= 12; month++) sum += bengaliMonthLength(bengaliYear, month);
  return sum;
}

function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

/** Whole-day difference (b − a), both UTC dates. */
function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Gregorian (UTC) → Bengali. */
export function gregorianToBengali(gregorian: Date): BengaliDate {
  const gy = gregorian.getUTCFullYear();
  const gm = gregorian.getUTCMonth() + 1; // 1–12
  const gd = gregorian.getUTCDate();

  const onOrAfterNewYear = gm > 4 || (gm === 4 && gd >= 14);
  const bengaliYear = onOrAfterNewYear ? gy - 593 : gy - 594;
  const anchorYear = onOrAfterNewYear ? gy : gy - 1;
  const elapsed = diffDays(utcDate(anchorYear, 3, 14), gregorian); // 0-based since বৈশাখ ১

  let month = 1;
  let remaining = elapsed;
  while (remaining >= bengaliMonthLength(bengaliYear, month)) {
    remaining -= bengaliMonthLength(bengaliYear, month);
    month += 1;
  }
  return { year: bengaliYear, month, day: remaining + 1 };
}

/** Bengali → Gregorian (UTC midnight). */
export function bengaliToGregorian(bengali: BengaliDate): Date {
  let elapsed = bengali.day - 1;
  for (let month = 1; month < bengali.month; month++) {
    elapsed += bengaliMonthLength(bengali.year, month);
  }
  const anchor = utcDate(bengali.year + 593, 3, 14); // বৈশাখ ১ = April 14
  return new Date(anchor.getTime() + elapsed * 86_400_000);
}

/** Sun-first weekday index (0 = রবিবার) of a Gregorian date. */
export function bengaliWeekdayIndex(gregorian: Date): number {
  return gregorian.getUTCDay();
}

/** "১৫ জ্যৈষ্ঠ ১৪৩২" — the compact display form. */
export function formatBengaliDate(bengali: BengaliDate): string {
  return `${toBnDigits(bengali.day)} ${BENGALI_MONTHS_BN[bengali.month - 1]} ${toBnDigits(bengali.year)}`;
}

/** "শুক্রবার, ১৫ জ্যৈষ্ঠ ১৪৩২" — with the weekday, for the trigger button. */
export function formatBengaliDateLong(bengali: BengaliDate, gregorian: Date): string {
  return `${BENGALI_WEEKDAYS_LONG[bengaliWeekdayIndex(gregorian)]}, ${formatBengaliDate(bengali)}`;
}

/* ————— wire format ("YYYY-MM-DD", the unchanged contract) ————— */

export function wireToDate(wire: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(wire.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = utcDate(Number(y), Number(m) - 1, Number(d));
  // reject impossible dates (e.g. 2026-02-31) — UTC normalization would shift them
  if (date.getUTCMonth() + 1 !== Number(m) || date.getUTCDate() !== Number(d)) return null;
  return date;
}

export function dateToWire(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Wire value → Bengali, or null for empty/invalid. */
export function wireToBengali(wire: string): BengaliDate | null {
  const date = wireToDate(wire);
  return date ? gregorianToBengali(date) : null;
}

/** Bengali → wire value. */
export function bengaliToWire(bengali: BengaliDate): string {
  return dateToWire(bengaliToGregorian(bengali));
}

/** Wire value → "শুক্রবার, ১৫ জ্যৈষ্ঠ ১৪৩২" (or "" for empty/invalid). */
export function formatWireDateBn(wire: string): string {
  const date = wireToDate(wire);
  return date ? formatBengaliDateLong(gregorianToBengali(date), date) : "";
}

/** Today (UTC-anchored) as a wire value. */
export function todayWire(): string {
  return dateToWire(new Date());
}

/** The first day of the Bengali month containing the wire date (or Boishakh of today's year). */
export function monthStartWire(wire: string): string {
  const bengali = wireToBengali(wire);
  const anchor = bengali ?? gregorianToBengali(new Date());
  return bengaliToWire({ year: anchor.year, month: anchor.month, day: 1 });
}
