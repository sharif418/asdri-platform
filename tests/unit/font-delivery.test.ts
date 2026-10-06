import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { allFontFaces, criticalFontHrefs } from "@/lib/fonts";

const repoRoot = join(import.meta.dir, "../..");

/**
 * Font delivery contract (Round 4, PR perf/r4-font-delivery).
 *
 * next/font/local used to eager-preload every src file via RSC :HL hints —
 * every page downloaded all ~760 KB of fonts. The replacement is manual
 * @font-face with per-script unicode-range plus a small lang-critical
 * preload set. These tests pin that contract.
 */

describe("font delivery", () => {
  test("every manifest face file exists on disk under public/fonts", () => {
    for (const { url } of allFontFaces()) {
      const file = join(repoRoot, "public", url);
      expect(existsSync(file), `${url} missing — re-run scripts/subset-fonts.py`).toBe(true);
    }
  });

  test("bn critical set preloads Bengali body + Tiro headings + Hind latin (spaces)", () => {
    const urls = criticalFontHrefs("bn").map((u) => u.split("/").pop()!.split(".")[0]);
    expect(urls).toEqual([
      "hind-bengali-400",
      "hind-bengali-500",
      "hind-bengali-600",
      "tiro-bengali-400",
      "hind-latin-400",
    ]);
    for (const href of criticalFontHrefs("bn")) {
      expect(existsSync(join(repoRoot, "public", href)), `${href} missing`).toBe(true);
    }
  });

  test("en critical set preloads Latin body + Cormorant headings, never Bengali faces", () => {
    const urls = criticalFontHrefs("en").map((u) => u.split("/").pop()!.split(".")[0]);
    expect(urls).toEqual([
      "hind-latin-400",
      "hind-latin-500",
      "hind-latin-600",
      "cormorant-latin-600",
    ]);
    // The whole point: /en must never preload a Bengali face.
    expect(urls.some((u) => u.includes("bengali"))).toBe(false);
  });

  test("total shipped font weight stays under the old single-page payload", () => {
    // The old next/font setup force-fetched ~760 KB on every page. All 15
    // faces together (no page ever needs them all) must stay below that.
    const total = allFontFaces().reduce((sum, { info }) => sum + info.bytes, 0);
    expect(total).toBeLessThan(760 * 1024);
  });

  test("fonts.css declares unicode-range on every real face and defines the four stacks", () => {
    const css = readFileSync(join(repoRoot, "src/app/fonts.css"), "utf8");
    const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map((m) => m[1]);
    const realFaces = faces.filter((f) => f.includes("/fonts/"));
    expect(realFaces.length).toBe(allFontFaces().length);
    for (const face of realFaces) {
      expect(face).toContain("unicode-range:");
      expect(face).toContain("font-display:swap");
      const src = face.match(/url\('([^']+)'/)![1];
      expect(existsSync(join(repoRoot, "public", src)), `${src} referenced but missing`).toBe(true);
    }
    // Metric-adjusted fallbacks (the CLS-tightening next/font used to emit).
    for (const fb of ["Hind Siliguri Fallback", "Tiro Bangla Fallback", "Amiri Fallback", "Cormorant Garamond Fallback"]) {
      expect(css).toContain(fb);
    }
    for (const v of ["--font-body", "--font-heading", "--font-arabic", "--font-latin-display"]) {
      expect(css).toContain(v);
    }
  });

  test("globals.css imports fonts.css and no layout references next/font anymore", () => {
    const globals = readFileSync(join(repoRoot, "src/app/globals.css"), "utf8");
    expect(globals).toContain('@import "./fonts.css"');
    for (const layout of ["src/app/[lang]/layout.tsx", "src/app/admin/layout.tsx"]) {
      const src = readFileSync(join(repoRoot, layout), "utf8");
      // import-level references only (comments mentioning the history are fine)
      expect(/from ["']next\/font/.test(src), `${layout} still wires next/font`).toBe(false);
      expect(src).toContain("antialiased");
    }
    // The site layout must preload per language.
    const siteLayout = readFileSync(join(repoRoot, "src/app/[lang]/layout.tsx"), "utf8");
    expect(siteLayout).toContain("criticalFontHrefs");
  });
});
