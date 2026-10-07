import { describe, test, expect } from "bun:test";
import {
  swapPreBaseSigns,
  searchSquash,
} from "@/components/library/reader/use-pdf";

/**
 * Round 5 — in-reader search canonicalization pins.
 *
 * Chromium-printed Bangla PDFs extract text in VISUAL order: pre-base vowel
 * signs (ি ে ৈ) precede their consonant and glyph clusters arrive as
 * separate items, so a logical query like "দেন" never matches the raw
 * stream "েদ ন". The reader therefore searches the squashed haystack with
 * BOTH the plain and the swapped needle. These tests pin the two pure
 * helpers; the end-to-end behaviour is covered by browser QA against the
 * seeded demo PDF.
 */
describe("swapPreBaseSigns", () => {
  test("logical order is untouched when no sign precedes a consonant", () => {
    // তা ও হী — no pre-base signs at all
    expect(swapPreBaseSigns("তাওহীদ")).toBe("তাওহীদ");
    // Latin / Arabic unaffected
    expect(swapPreBaseSigns("Zirconium")).toBe("Zirconium");
    expect(swapPreBaseSigns("قُلْ هُوَ")).toBe("قُلْ هُوَ");
  });

  test("visual-order cluster is restored to logical order", () => {
    // Chromium extracts "দেন" as "েদ" + "ন"
    expect(swapPreBaseSigns("েদন")).toBe("দেন");
    // "ভেদ" → "েভ" + "দ"
    expect(swapPreBaseSigns("েভদ")).toBe("ভেদ");
    // "মিক" → "িম" + "ক"
    expect(swapPreBaseSigns("িমক")).toBe("মিক");
  });

  test("consecutive pre-base signs each pair with their consonant", () => {
    // "দিনের" in visual order: িদ + েন + র
    expect(swapPreBaseSigns("িদেনর")).toBe("দিনের");
  });

  test("a sign not followed by a Bengali consonant is left alone", () => {
    expect(swapPreBaseSigns("ে")).toBe("ে");
    expect(swapPreBaseSigns("ো")).toBe("ো"); // া is a sign, not a consonant
    expect(swapPreBaseSigns("ি ে")).toBe("ি ে");
  });

  test("real Chromium extraction shapes match after reconstruction", () => {
    // Actual pdf.js items from a Chromium-printed page (measured):
    // "তাওহীদের" → "তা" "ও" "হী" "েদ" "র"
    expect(swapPreBaseSigns("তাওহীেদর")).toBe("তাওহীদের");
    // "ভূমিকা" → "ভূ" "িম" "কা"
    expect(swapPreBaseSigns("ভূিমকা")).toBe("ভূমিকা");
    // "পাঠ" has no pre-base sign — identity
    expect(swapPreBaseSigns("পাঠ")).toBe("পাঠ");
  });
});

describe("searchSquash", () => {
  test("whitespace and NUL collapse away, case folds", () => {
    expect(searchSquash("  তা ও হী েদ র ")).toBe("তাওহীেদর");
    expect(searchSquash("Zir\u0000con ium")).toBe("zirconium");
    expect(searchSquash("MiXeD Case")).toBe("mixedcase");
  });

  test("round trip: a visual-order page matches a logical query", () => {
    // What a Chromium PDF actually contains for "প্রকারভেদ" (item-split,
    // ে rendered left of ভ):
    const pageFragment = "প্র কা র েভ দ — প্র কা র প্রকার র েভ দ";
    const haystack = searchSquash(pageFragment);
    const logical = swapPreBaseSigns(haystack);
    // the plain (logical) needle the reader searches with:
    expect(logical).toContain("প্রকারভেদ");
    // and the raw haystack keeps the visual spelling (both are searched):
    expect(haystack).toContain("েভদ");
  });
});
