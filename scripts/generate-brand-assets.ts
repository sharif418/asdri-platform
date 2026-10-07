/**
 * Brand asset pipeline — derives every secondary brand artifact from the two
 * official masters under public/brand/ (see src/lib/brand.ts, the single
 * source of truth for the institute's identity files):
 *
 *   - mark-mono-{gold,ivory,emerald}.png : true one-colour marks (alpha of the
 *     master used as a mask over solid ink) for print, watermarks and
 *     ornaments — the office can print them in a single colour at any size
 *   - lockup-email.png                    : the full lockup on a white ground,
 *     sized for e-mail clients (rendered at 240 CSS px, shipped at 2×)
 *   - og-default.png                      : the 1200×630 Open Graph card that
 *     travels with every shared link — emerald ground, double gold hairline
 *     frame, the official lockup
 *
 * Run: bun run scripts/generate-brand-assets.ts   (after replacing any master
 * under public/brand/ — rerunning regenerates every derivative deterministically)
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const BRAND_DIR = "public/brand";
const MARK = `${BRAND_DIR}/mark.webp`;
const LOCKUP_DEFAULT = `${BRAND_DIR}/logo-horizontal.webp`;
const LOCKUP_DARK = `${BRAND_DIR}/logo-horizontal-dark.webp`;

/** Brand inks (sRGB twins of the CSS tokens in globals.css / mail.ts). */
const GOLD = "#d4af37";
const IVORY = "#f7f3e8";
const EMERALD = "#0f5132";

/** True monochrome: the master's alpha masks a solid ink ground. */
async function mono(color: string, target: string): Promise<void> {
  const mask = await sharp(MARK).ensureAlpha().toBuffer();
  const meta = await sharp(MARK).metadata();
  const width = meta.width ?? 512;
  const height = meta.height ?? 512;
  const solid = await sharp({
    create: { width, height, channels: 4, background: color },
  })
    .png()
    .toBuffer();
  const out = await sharp(solid)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  writeFileSync(`${BRAND_DIR}/${target}`, out);
}

/** The lockup flattened onto white at 2× for e-mail clients (240 CSS px wide). */
async function emailLockup(): Promise<void> {
  // E-mail bodies are light: use the default (light-surface) lockup.
  const lockup = await sharp(LOCKUP_DEFAULT).resize(480, undefined, { fit: "inside" }).toBuffer();
  const meta = await sharp(lockup).metadata();
  const width = 480;
  const height = (meta.height ?? 122) + 56; // generous white padding
  const out = await sharp({
    create: { width, height, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: lockup, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(`${BRAND_DIR}/lockup-email.png`, out);
}

/**
 * The Open Graph card: 1200×630, deep emerald ground, an inset double gold
 * hairline frame (the illuminated-manuscript border the page band carries),
 * the official lockup centred with ceremony and clear space.
 */
async function ogCard(): Promise<void> {
  const W = 1200;
  const H = 630;
  const lockup = await sharp(LOCKUP_DARK).resize(760, undefined, { fit: "inside" }).png().toBuffer();
  const lockupMeta = await sharp(lockup).metadata();
  const lockupW = lockupMeta.width ?? 760;
  const lockupH = lockupMeta.height ?? 192;

  // Ground: deep emerald with a quiet radial lift behind the lockup.
  const ground = Buffer.from(
    `<svg width="${W}" height="${H}">
       <defs>
         <radialGradient id="lift" cx="50%" cy="46%" r="72%">
           <stop offset="0%" stop-color="#14543a"/>
           <stop offset="100%" stop-color="${EMERALD}"/>
         </radialGradient>
       </defs>
       <rect width="${W}" height="${H}" fill="url(#lift)"/>
     </svg>`,
  );

  // Frame: double gold hairline, inset 28px and 40px, with the corner
  // emphasis of an illuminated border (heavier stroke on the inner line).
  const frame = Buffer.from(
    `<svg width="${W}" height="${H}">
       <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${GOLD}" stroke-opacity="0.55" stroke-width="1.5"/>
       <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${GOLD}" stroke-opacity="0.9" stroke-width="2.5"/>
       <rect x="52" y="52" width="18" height="18" fill="none" stroke="${GOLD}" stroke-width="2.5"/>
       <rect x="${W - 70}" y="52" width="18" height="18" fill="none" stroke="${GOLD}" stroke-width="2.5"/>
       <rect x="52" y="${H - 70}" width="18" height="18" fill="none" stroke="${GOLD}" stroke-width="2.5"/>
       <rect x="${W - 70}" y="${H - 70}" width="18" height="18" fill="none" stroke="${GOLD}" stroke-width="2.5"/>
     </svg>`,
  );

  const out = await sharp(ground)
    .composite([
      { input: lockup, left: Math.round((W - lockupW) / 2), top: Math.round((H - lockupH) / 2) },
      { input: frame, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(`${BRAND_DIR}/og-default.png`, out);
}

mkdirSync(BRAND_DIR, { recursive: true });
await mono(GOLD, "mark-mono-gold.png");
await mono(IVORY, "mark-mono-ivory.png");
await mono(EMERALD, "mark-mono-emerald.png");
await emailLockup();
await ogCard();
console.log(
  [
    "brand assets regenerated:",
    "  mark-mono-gold.png / mark-mono-ivory.png / mark-mono-emerald.png (one-colour marks)",
    "  lockup-email.png (white-ground lockup for e-mail)",
    "  og-default.png (1200×630 Open Graph card)",
  ].join("\n"),
);
