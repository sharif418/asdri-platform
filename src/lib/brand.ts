/**
 * Brand assets — the single place the institute's identity files are declared.
 *
 * The office supplied the official logo (Arabic calligraphy + English wordmark + the arch/
 * book/pen mark). Everything that shows the brand — header, footer, drawer, admin, 404,
 * favicon, app icons — reads from here, so replacing a file in public/brand/ (and re-running
 * `bun run scripts/generate-icons.ts` for the icons) updates the whole site.
 *
 * Two tones: `default` for light surfaces (teal + gold) and `on-dark` for the emerald bands
 * (teal recoloured to ivory, gold kept). Both are generated from the same master.
 */
export const brand = {
  nameEn: "As-Sunnah Dawah & Research Institute",
  lockup: {
    default: "/brand/logo-horizontal.webp",
    "on-dark": "/brand/logo-horizontal-dark.webp",
    width: 900,
    height: 228,
  },
  mark: {
    default: "/brand/mark.webp",
    "on-dark": "/brand/mark-dark.webp",
    width: 512,
    height: 543,
  },
} as const;

export type BrandTone = "default" | "on-dark";
