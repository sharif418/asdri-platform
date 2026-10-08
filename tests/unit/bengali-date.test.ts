import { describe, test, expect } from "bun:test";
import {
  BENGALI_MONTHS_BN,
  BENGALI_WEEKDAYS_LONG,
  bengaliMonthLength,
  bengaliToGregorian,
  bengaliToWire,
  bengaliYearLength,
  dateToWire,
  formatBengaliDate,
  formatWireDateBn,
  gregorianToBengali,
  isGregorianLeap,
  todayWire,
  wireToBengali,
} from "@/lib/bengali-date";

/**
 * Round-9 — the Bengali calendar math proofs (restored round-6 component):
 * the 2019-revised Bangladesh calendar (বৈশাখ ১ = April 14, every year).
 */

describe("bengali-date (pure math)", () => {
  test("the year length is 365, and 366 only when Falgun carries the leap day", () => {
    expect(bengaliYearLength(1432)).toBe(365); // Falgun 1432 → Feb 2026 (not leap)
    expect(bengaliYearLength(1426)).toBe(366); // Falgun 1426 → Feb 2020 (leap)
  });

  test("Falgun is 29 days, 30 in a leap February", () => {
    // Falgun of বঙ্গাব্দ Y falls in February Y+594
    expect(bengaliMonthLength(1432, 11)).toBe(29); // Feb 2026 — not leap
    expect(bengaliMonthLength(1426, 11)).toBe(30); // Feb 2020 — leap
    expect(bengaliMonthLength(1438, 11)).toBe(30); // Feb 2032 — leap
  });

  test("the fixed month skeleton: Boishakh–Ashwin 31, Kartik–Magh 30, Choitro 30", () => {
    const lengths = Array.from({ length: 12 }, (_, i) => bengaliMonthLength(1431, i + 1));
    expect(lengths.slice(0, 6)).toEqual([31, 31, 31, 31, 31, 31]);
    expect(lengths.slice(6, 10)).toEqual([30, 30, 30, 30]);
    expect(lengths[11]).toBe(30);
  });

  test("April 14 is বৈশাখ ১ (the anchor, on both sides)", () => {
    expect(gregorianToBengali(new Date("2026-04-14T00:00:00Z"))).toEqual({ year: 1433, month: 1, day: 1 });
    // the day before is চৈত্র ৩০ of the previous year
    expect(gregorianToBengali(new Date("2026-04-13T00:00:00Z"))).toEqual({ year: 1432, month: 12, day: 30 });
  });

  test("the year flips across the April boundary", () => {
    expect(gregorianToBengali(new Date("2026-01-01T00:00:00Z")).year).toBe(1432);
    expect(gregorianToBengali(new Date("2026-12-31T00:00:00Z")).year).toBe(1433);
  });

  test("every day of a full year round-trips (1432, a leap-Falgun year)", () => {
    let cursor = new Date("2025-04-14T00:00:00Z"); // বৈশাখ ১, 1432
    const end = new Date("2026-04-13T00:00:00Z"); // চৈত্র ৩০, 1432
    let count = 0;
    while (cursor <= end) {
      const bengali = gregorianToBengali(cursor);
      const back = bengaliToGregorian(bengali);
      expect(dateToWire(back)).toBe(dateToWire(cursor));
      cursor = new Date(cursor.getTime() + 86_400_000);
      count += 1;
    }
    expect(count).toBe(365); // 1432: Falgun has 29 (Feb 2026 not leap)
  });

  test("the leap Falgun year round-trips 366 days", () => {
    let cursor = new Date("2019-04-14T00:00:00Z"); // বৈশাখ ১, 1426
    let count = 0;
    while (count < 366) {
      const bengali = gregorianToBengali(cursor);
      expect(dateToWire(bengalianToGregorianChecked(bengali))).toBe(dateToWire(cursor));
      cursor = new Date(cursor.getTime() + 86_400_000);
      count += 1;
    }
    // the 366th day is চৈত্র ৩০ and the next is a new বৈশাখ ১
    expect(gregorianToBengali(cursor)).toEqual({ year: 1427, month: 1, day: 1 });
  });

  test("known landmark: ২৬ মার্চ ২০২৬ (Independence Day) reads in Bangla", () => {
    expect(gregorianToBengali(new Date("2026-03-26T00:00:00Z"))).toEqual({ year: 1432, month: 12, day: 12 });
  });

  test("known landmark: ২১শে ফেব্রুয়ারি (Shaheed Day)", () => {
    expect(gregorianToBengali(new Date("2026-02-21T00:00:00Z"))).toEqual({ year: 1432, month: 11, day: 8 });
  });

  test("formatting: compact + long forms in Bangla digits", () => {
    expect(formatBengaliDate({ year: 1432, month: 2, day: 15 })).toBe("১৫ জ্যৈষ্ঠ ১৪৩২");
    // ২৮ মে ২০২৬ = ১৪ জ্যৈষ্ঠ ১৪৩৩; the weekday comes from the Gregorian calendar
    const weekday = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"][
      new Date("2026-05-28T00:00:00Z").getUTCDay()
    ];
    expect(formatWireDateBn("2026-05-28")).toBe(`${weekday}, ১৪ জ্যৈষ্ঠ ১৪৩৩`);
  });

  test("wire helpers reject malformed and impossible dates", () => {
    expect(wireToBengali("")).toBeNull();
    expect(wireToBengali("2026-13-01")).toBeNull();
    expect(wireToBengali("2026-02-31")).toBeNull();
    expect(wireToBengali("not-a-date")).toBeNull();
    expect(wireToBengali("2026-02-29")).toBeNull(); // 2026 not leap
    expect(wireToBengali("2024-02-29")).not.toBeNull(); // 2024 leap
  });

  test("bengaliToWire + wireToBengali are inverse on valid input", () => {
    const wire = bengaliToWire({ year: 1432, month: 7, day: 10 });
    expect(wire).toBe("2025-10-26");
    expect(wireToBengali(wire)).toEqual({ year: 1432, month: 7, day: 10 });
  });

  test("todayWire is a valid wire date", () => {
    expect(wireToBengali(todayWire())).not.toBeNull();
  });

  test("the twelve month names and seven weekday names are intact", () => {
    expect(BENGALI_MONTHS_BN.length).toBe(12);
    expect(BENGALI_MONTHS_BN[0]).toBe("বৈশাখ");
    expect(BENGALI_MONTHS_BN[11]).toBe("চৈত্র");
    expect(BENGALI_WEEKDAYS_LONG[0]).toBe("রবিবার");
    expect(BENGALI_WEEKDAYS_LONG[6]).toBe("শনিবার");
    expect(isGregorianLeap(2024)).toBe(true);
    expect(isGregorianLeap(2026)).toBe(false);
  });
});

/** Guarded helper so a bad conversion throws loudly instead of silently passing. */
function bengalianToGregorianChecked(bengali: { year: number; month: number; day: number }): Date {
  const date = bengaliToGregorian(bengali);
  if (Number.isNaN(date.getTime())) throw new Error(`bad conversion: ${JSON.stringify(bengali)}`);
  return date;
}
