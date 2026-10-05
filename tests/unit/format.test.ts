import { describe, test, expect } from "bun:test";
import {
  toBnDigits,
  formatNumber,
  formatTaka,
  formatCompactTaka,
  formatDate,
  formatMonthYear,
  daysAgoLabel,
  isNewNotice,
  readMinutes,
  formatBytes,
} from "@/lib/format";

describe("toBnDigits", () => {
  test("maps every Latin digit to its Bengali digit", () => {
    expect(toBnDigits("0123456789")).toBe("০১২৩৪৫৬৭৮৯");
  });

  test("round-trips through the Bengali digit table", () => {
    const bnToLatin: Record<string, string> = {
      "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
      "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
    };
    for (let d = 0; d <= 9; d++) {
      const bn = toBnDigits(d);
      expect(bnToLatin[bn]).toBe(String(d));
    }
  });

  test("leaves non-digits untouched", () => {
    expect(toBnDigits("DN-2026-000001")).toBe("DN-২০২৬-০০০০০১");
    expect(toBnDigits("abc")).toBe("abc");
  });

  test("accepts numbers", () => {
    expect(toBnDigits(45)).toBe("৪৫");
  });
});

describe("formatNumber", () => {
  test("groups thousands with commas (en-US grouping, Bengali digits for bn)", () => {
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
    expect(formatNumber(1234567, "bn")).toBe("১,২৩৪,৫৬৭");
  });

  test("small numbers have no separators", () => {
    expect(formatNumber(250, "bn")).toBe("২৫০");
    expect(formatNumber(250, "en")).toBe("250");
  });
});

describe("formatTaka", () => {
  test("prefixes ৳ and groups with commas", () => {
    expect(formatTaka(1500, "bn")).toBe("৳১,৫০০");
    expect(formatTaka(1500, "en")).toBe("৳1,500");
  });

  test("rounds fractional taka (integer amounts only)", () => {
    expect(formatTaka(1500.6, "en")).toBe("৳1,501");
    expect(formatTaka(10.2, "bn")).toBe("৳১০");
  });
});

describe("formatCompactTaka", () => {
  test("lakh form above or at 1,00,000", () => {
    expect(formatCompactTaka(250000, "bn")).toBe("৳২.৫ লক্ষ");
    expect(formatCompactTaka(250000, "en")).toBe("৳2.5L");
    expect(formatCompactTaka(100000, "bn")).toBe("৳১ লক্ষ");
    expect(formatCompactTaka(100000, "en")).toBe("৳1L");
  });

  test("hajar form between 1,000 and 1,00,000", () => {
    expect(formatCompactTaka(2500, "bn")).toBe("৳২.৫ হাজার");
    expect(formatCompactTaka(2500, "en")).toBe("৳2.5K");
    expect(formatCompactTaka(4000, "en")).toBe("৳4K");
  });

  test("falls back to plain taka below 1,000", () => {
    expect(formatCompactTaka(750, "bn")).toBe("৳৭৫০");
    expect(formatCompactTaka(750, "en")).toBe("৳750");
  });
});

describe("formatDate", () => {
  // Constructed with local components so the result is TZ-independent.
  const jan15 = new Date(2025, 0, 15);
  const aug9 = new Date(2026, 7, 9);

  test("Bangla: day month year with Bengali digits", () => {
    expect(formatDate(jan15, "bn")).toBe("১৫ জানুয়ারি ২০২৫");
    expect(formatDate(aug9, "bn")).toBe("৯ আগস্ট ২০২৬");
  });

  test("English: day month year", () => {
    expect(formatDate(jan15, "en")).toBe("15 January 2025");
    expect(formatDate(aug9, "en")).toBe("9 August 2026");
  });

  test("invalid dates render as empty string", () => {
    expect(formatDate("not-a-date", "bn")).toBe("");
    expect(formatDate(new Date("invalid"), "en")).toBe("");
  });
});

describe("formatMonthYear", () => {
  test("month + year for archive headers", () => {
    expect(formatMonthYear(new Date(2025, 0, 15), "bn")).toBe("জানুয়ারি ২০২৫");
    expect(formatMonthYear(new Date(2025, 0, 15), "en")).toBe("January 2025");
  });
});

describe("daysAgoLabel", () => {
  test("today / yesterday / N days ago", () => {
    expect(daysAgoLabel(new Date(), "bn")).toBe("আজ");
    expect(daysAgoLabel(new Date(), "en")).toBe("Today");
    expect(daysAgoLabel(new Date(Date.now() - 86_400_000), "en")).toBe("Yesterday");
    expect(daysAgoLabel(new Date(Date.now() - 2 * 86_400_000), "en")).toBe("2 days ago");
    expect(daysAgoLabel(new Date(Date.now() - 2 * 86_400_000), "bn")).toBe("২ দিন আগে");
  });
});

describe("isNewNotice", () => {
  test("fresh within 14 days, stale after", () => {
    expect(isNewNotice(new Date(Date.now() - 1000))).toBe(true);
    expect(isNewNotice(new Date(Date.now() - 15 * 86_400_000))).toBe(false);
  });
});

describe("readMinutes", () => {
  test("minimum one minute", () => {
    expect(readMinutes("")).toBe(1);
    expect(readMinutes("ছোট")).toBe(1);
  });

  test("~180 words per minute", () => {
    const words = Array.from({ length: 360 }, (_, i) => `word${i}`).join(" ");
    expect(readMinutes(words)).toBe(2);
  });
});

describe("formatBytes", () => {
  test("zero and bytes below 1 KB", () => {
    expect(formatBytes(0, "bn")).toBe("০ B");
    expect(formatBytes(0, "en")).toBe("0 B");
    expect(formatBytes(512, "en")).toBe("512 B");
    expect(formatBytes(512, "bn")).toBe("৫১২ B");
  });

  test("kilobytes and megabytes", () => {
    expect(formatBytes(2048, "en")).toBe("2.0 KB");
    expect(formatBytes(2048, "bn")).toBe("২.০ KB");
    expect(formatBytes(2 * 1024 * 1024, "en")).toBe("2.0 MB");
  });
});
