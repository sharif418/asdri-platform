import manifest from "../../public/fonts/manifest.json";

/**
 * Self-hosted typefaces, served per-script from /public/fonts via @font-face
 * with unicode-range (see src/app/fonts.css + scripts/subset-fonts.py).
 *
 * This replaces next/font/local: next/font eagerly preloads EVERY src file via
 * RSC :HL hints, so every page downloaded all ~760 KB of fonts (both Amiri
 * weights + all Cormorant weights even on pages that never render them) in
 * direct competition with the hero image for bandwidth. Now the browser only
 * fetches the script/weight faces a page actually renders, and the layout
 * preloads just the language-critical faces (see criticalFontHrefs).
 *
 * The manifest is generated together with the woff2 files, so filenames stay
 * in sync with the CSS (re-run scripts/subset-fonts.py after touching
 * anything under src/fonts/).
 */

type FaceInfo = {
  family: string;
  script: "bengali" | "latin" | "arabic" | "ayah";
  weight: number;
  unicodeRange: string;
  bytes: number;
};

const faces = manifest as Record<string, FaceInfo>;

function faceUrl(family: string, script: FaceInfo["script"], weight: number): string {
  const hit = Object.entries(faces).find(
    ([, info]) => info.family === family && info.script === script && info.weight === weight,
  );
  if (!hit) {
    throw new Error(`font face not found: ${family} ${script} ${weight} — re-run scripts/subset-fonts.py`);
  }
  return `/fonts/${hit[0]}`;
}

/**
 * Fonts whose early arrival gates first paint of above-fold text, per site
 * language (audited via computed styles of above-fold leaf elements):
 *   bn — Hind Bengali body weights + Tiro Bangla headings + Hind Latin (spaces).
 *   en — Hind Latin body weights + Cormorant 600 headings.
 * Everything else (Amiri for the bismillah, Bengali names on /en, the odd
 * bold weight) is fetched lazily by the first layout that needs it.
 */
export function criticalFontHrefs(lang: "bn" | "en"): string[] {
  if (lang === "bn") {
    return [
      faceUrl("hind-siliguri", "bengali", 400),
      faceUrl("hind-siliguri", "bengali", 500),
      faceUrl("hind-siliguri", "bengali", 600),
      faceUrl("tiro-bangla", "bengali", 400),
      faceUrl("hind-siliguri", "latin", 400),
    ];
  }
  return [
    faceUrl("hind-siliguri", "latin", 400),
    faceUrl("hind-siliguri", "latin", 500),
    faceUrl("hind-siliguri", "latin", 600),
    faceUrl("cormorant-garamond", "latin", 600),
  ];
}

/** All faces, for diagnostics/tests. */
export function allFontFaces(): Array<{ url: string; info: FaceInfo }> {
  return Object.entries(faces).map(([name, info]) => ({ url: `/fonts/${name}`, info }));
}
