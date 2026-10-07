import { describe, test, expect } from "bun:test";
import { deriveJournalKey } from "@/lib/library";

/**
 * Round 4, workstream 4 — journalKey derivation pins. The key groups issues
 * of the same journal, so it must be DETERMINISTIC: the same journal name
 * always yields the same key, a Bangla-only name yields "" (never a random
 * timestamp fallback), and an explicit key always wins.
 */
describe("deriveJournalKey", () => {
  test("explicit key wins over names", () => {
    expect(deriveJournalKey("custom-key", "As-Sunnah Journal", "আস-সুন্নাহ জার্নাল")).toBe("custom-key");
    expect(deriveJournalKey("custom-key", "", "")).toBe("custom-key");
  });

  test("empty key falls back to the English journal name's slug", () => {
    expect(deriveJournalKey("", "As-Sunnah Journal", "আস-সুন্নাহ জার্নাল")).toBe("as-sunnah-journal");
    expect(deriveJournalKey("", "Research Bulletin", "")).toBe("research-bulletin");
    expect(deriveJournalKey(undefined, "As-Sunnah Journal", undefined)).toBe("as-sunnah-journal");
  });

  test("a Bangla-only name yields an empty key, never a random fallback", () => {
    // slugify()'s timestamp fallback would give every issue a DIFFERENT key —
    // the grouping would silently break. "" is honest: ungrouped until the
    // librarian types a key.
    expect(deriveJournalKey("", "", "আস-সুন্নাহ জার্নাল")).toBe("");
    expect(deriveJournalKey(undefined, undefined, "গবেষণা বার্তা")).toBe("");
  });

  test("deterministic across calls (the grouping contract)", () => {
    const first = deriveJournalKey("", "As-Sunnah Journal", "আস-সুন্নাহ জার্নাল");
    const second = deriveJournalKey("", "As-Sunnah Journal", "আস-সুন্নাহ জার্নাল");
    expect(first).toBe(second);
  });
});
