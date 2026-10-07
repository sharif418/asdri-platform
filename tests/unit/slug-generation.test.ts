import { describe, test, expect } from "bun:test";
import { slugifyTitle, slugify, buildUniqueSlug } from "@/lib/slug";

/**
 * Round 4, C2 regression pins: Bangla-only titles slugify to "" and used to
 * collide on a constant fallback (`notice`, `post`, …), so only ONE
 * Bangla-only record of each type could ever be created. The routes now call
 * `buildUniqueSlug(base, exists)` with the generic `slugify` fallback
 * (`n-<timestamp36>`); these tests pin that contract without a database.
 */

describe("slugifyTitle", () => {
  test("keeps only lowercase ascii letters, digits and hyphens", () => {
    expect(slugifyTitle("Hello World 2026!")).toBe("hello-world-2026");
    expect(slugifyTitle("  Multiple   spaces  ")).toBe("multiple-spaces");
  });

  test("bangla-only titles slugify to the empty string (the C2 root cause)", () => {
    expect(slugifyTitle("বাংলা শিরোনাম মাত্র")).toBe("");
    expect(slugifyTitle("আব্দুল্লাহ")).toBe("");
  });

  test("mixed titles keep their ascii part", () => {
    expect(slugifyTitle("QA রাউন্ড ৪ অডিট")).toBe("qa");
  });

  test("caps the base at 80 characters", () => {
    const long = "a".repeat(300);
    const slug = slugifyTitle(long);
    expect(slug.length).toBe(80);
    expect(slug).toBe("a".repeat(80));
  });

  test("hyphen-runs collapse and edges are trimmed before the cap", () => {
    expect(slugifyTitle("--a---b--")).toBe("a-b");
    expect(slugifyTitle(`${"x".repeat(90)}-tail`)).toBe("x".repeat(80));
  });
});

describe("slugify (route-side helper)", () => {
  test("delegates ascii titles to slugifyTitle", () => {
    expect(slugify("Annual Report")).toBe("annual-report");
  });

  test("bangla-only titles fall back to a generated n-<base36> base", () => {
    const base = slugify("শুধুই বাংলা");
    expect(base.startsWith("n-")).toBe(true);
    expect(base.length).toBeGreaterThan("n-".length);
  });
});

describe("buildUniqueSlug", () => {
  /** Fake exists() that remembers everything it has handed out. */
  function recordingExists(used: Set<string>) {
    return async (candidate: string): Promise<boolean> => used.has(candidate);
  }

  test("ascii base gets -2, -3… suffixes across repeated creates", async () => {
    const used = new Set<string>();
    const first = await buildUniqueSlug("foo", recordingExists(used));
    used.add(first);
    const second = await buildUniqueSlug("foo", recordingExists(used));
    used.add(second);
    const third = await buildUniqueSlug("foo", recordingExists(used));
    expect(first).toBe("foo");
    expect(second).toBe("foo-2");
    expect(third).toBe("foo-3");
  });

  test("bangla-only title: generated fallback stays unique across 3 creates", async () => {
    const used = new Set<string>();
    const slugs: string[] = [];
    for (let i = 0; i < 3; i++) {
      // Exactly what the admin POST routes do for a Bangla-only title.
      const slug = await buildUniqueSlug(slugify("প্রথম বাংলা নোটিশ"), recordingExists(used));
      used.add(slug);
      slugs.push(slug);
    }
    expect(new Set(slugs).size).toBe(3);
    for (const slug of slugs) {
      expect(slug.length).toBeGreaterThanOrEqual(3); // passes zod slug.min(3)
      expect(/^[a-z0-9-]+$/.test(slug)).toBe(true); // passes the slug regex
    }
  });

  test("falls back to a timestamped base after 25 collisions", async () => {
    const alwaysTaken = async (): Promise<boolean> => true;
    const slug = await buildUniqueSlug("foo", alwaysTaken);
    expect(slug.startsWith("foo-")).toBe(true);
    expect(Number.parseInt(slug.slice("foo-".length), 10)).toBeGreaterThan(0); // Date.now()
  });
});
