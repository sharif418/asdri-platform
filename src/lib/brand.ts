/**
 * Brand assets — the single place the institute's identity files are declared.
 *
 * The office supplied the official logo (Arabic calligraphy + English wordmark + the arch/
 * book/pen mark). Everything that shows the brand — header, footer, drawer, admin, 404,
 * favicon, app icons, e-mail, receipts, print, the Open Graph card — reads from here, so
 * replacing a file in public/brand/ (and re-running `bun run scripts/generate-icons.ts` +
 * `bun run scripts/generate-brand-assets.ts`) updates the whole platform.
 *
 * Tones: `default` for light surfaces (teal + gold) and `on-dark` for the emerald bands
 * (teal recoloured to ivory, gold kept), both generated from the same master.
 *
 * Monochrome marks (`mono.*`) are true one-colour renders of the master's alpha — for
 * print, watermarks and ornaments where a single ink is the craft-correct choice.
 *
 * Size rules (carried by every component that renders the brand):
 *   - the full lockup's calligraphy stays legible from ~44px rendered height; below that
 *     the mark + typeset name lockup takes over (`LogoLockup variant="text"`)
 *   - clear space around the mark is one quarter of the mark's height on every side
 */
export const brand = {
  nameEn: "As-Sunnah Dawah & Research Institute",
  nameBn: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট",
  /** Short name for tight bars (admin sidebar, text lockup sub-line). */
  shortBn: "আস-সুন্নাহ ইনস্টিটিউট",
  shortEn: "ASDRI",
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
  /** One-colour marks (alpha-masked solid ink) — print, watermarks, ornaments. */
  mono: {
    gold: "/brand/mark-mono-gold.png",
    ivory: "/brand/mark-mono-ivory.png",
    emerald: "/brand/mark-mono-emerald.png",
    width: 512,
    height: 543,
  },
  /** E-mail-safe lockup (light-surface art flattened on white; 240 CSS px at 2×). */
  email: {
    image: "/brand/lockup-email.png",
    width: 480,
    height: 178,
  },
  /** The Open Graph card that travels with every shared link. */
  og: {
    image: "/brand/og-default.png",
    width: 1200,
    height: 630,
  },
  /** Below this rendered pixel height the lockup's calligraphy stops being legible. */
  lockupMinHeightPx: 44,
  /** Clear space around the mark, as a fraction of the mark's height. */
  clearSpaceRatio: 0.25,
} as const;

export type BrandTone = "default" | "on-dark";
export type BrandMonoTone = keyof typeof brand.mono;
