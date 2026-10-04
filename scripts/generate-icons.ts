/**
 * Icon pipeline — rasterises the master app icon (src/app/icon.svg) into
 * every favicon/PWA artifact the app serves:
 *   - src/app/favicon.ico        (16 + 32 + 48, PNG-embedded ICO)
 *   - src/app/apple-icon.png     (180×180, full-bleed square for iOS mask)
 *   - public/icons/*.png         (192/512 regular + maskable for the manifest)
 *
 * Run: bun run scripts/generate-icons.ts
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const APP_DIR = "src/app";
const PUBLIC_ICONS = "public/icons";

const ROUNDED_SVG = readFileSync(`${APP_DIR}/icon.svg`, "utf-8");

/** iOS apple-touch icon: solid square (no transparency, no rounding — iOS masks itself). */
const FULLBLEED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a5c46"/>
      <stop offset="55%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect x="20" y="20" width="472" height="472" fill="none" stroke="#c9a227" stroke-width="12" opacity="0.9"/>
  <rect x="36" y="36" width="440" height="440" fill="none" stroke="#c9a227" stroke-width="3" opacity="0.4"/>
  <g transform="translate(64 64) scale(6)">
    <circle cx="32" cy="32" r="30" stroke="#d9b64a" stroke-width="1.2" opacity="0.85" fill="none"/>
    <circle cx="32" cy="32" r="27.5" stroke="#d9b64a" stroke-width="0.6" opacity="0.45" fill="none"/>
    <path d="M37 11a12 12 0 1 0 6 16 9.8 9.8 0 1 1-6-16z" fill="#d9b64a"/>
    <path d="M42 10.5l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" fill="#ffffff"/>
    <path d="M14 38c5.4-3.5 11-3.5 16.5 0v11c-5.5-3.5-11-3.5-16.5 0z" fill="#fdfbf5"/>
    <path d="M33.5 38c5.4-3.5 11-3.5 16.5 0v11c-5.5-3.5-11-3.5-16.5 0z" fill="#fdfbf5" opacity="0.92"/>
    <path d="M32 37.2v12.4" stroke="#d9b64a" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M18 41.5c3-1.4 6-1.4 9 0M18 44.8c3-1.4 6-1.4 9 0M37 41.5c3-1.4 6-1.4 9 0M37 44.8c3-1.4 6-1.4 9 0" stroke="#064e3b" stroke-width="1" stroke-linecap="round" opacity="0.75"/>
  </g>
</svg>`;

/** Maskable PWA icon: mark shrunk to the 80% safe zone so launchers can crop. */
const MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a5c46"/>
      <stop offset="55%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(104 104) scale(4.75)">
    <circle cx="32" cy="32" r="30" stroke="#d9b64a" stroke-width="1.2" opacity="0.85" fill="none"/>
    <circle cx="32" cy="32" r="27.5" stroke="#d9b64a" stroke-width="0.6" opacity="0.45" fill="none"/>
    <path d="M37 11a12 12 0 1 0 6 16 9.8 9.8 0 1 1-6-16z" fill="#d9b64a"/>
    <path d="M42 10.5l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" fill="#ffffff"/>
    <path d="M14 38c5.4-3.5 11-3.5 16.5 0v11c-5.5-3.5-11-3.5-16.5 0z" fill="#fdfbf5"/>
    <path d="M33.5 38c5.4-3.5 11-3.5 16.5 0v11c-5.5-3.5-11-3.5-16.5 0z" fill="#fdfbf5" opacity="0.92"/>
    <path d="M32 37.2v12.4" stroke="#d9b64a" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M18 41.5c3-1.4 6-1.4 9 0M18 44.8c3-1.4 6-1.4 9 0M37 41.5c3-1.4 6-1.4 9 0M37 44.8c3-1.4 6-1.4 9 0" stroke="#064e3b" stroke-width="1" stroke-linecap="round" opacity="0.75"/>
  </g>
</svg>`;

function buildIco(pngs: Buffer[], sizes: number[]): Buffer {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  let offset = 6 + 16 * count;
  const entries: Buffer[] = [];
  pngs.forEach((png, index) => {
    const entry = Buffer.alloc(16);
    const dim = sizes[index] >= 256 ? 0 : sizes[index];
    entry.writeUInt8(dim, 0); // width
    entry.writeUInt8(dim, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(entry);
  });
  return Buffer.concat([header, ...entries, ...pngs]);
}

async function render(svg: string, size: number): Promise<Buffer> {
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

async function main(): Promise<void> {
  mkdirSync(PUBLIC_ICONS, { recursive: true });

  const icoSizes = [16, 32, 48];
  const icoPngs: Buffer[] = [];
  for (const size of icoSizes) {
    icoPngs.push(await render(ROUNDED_SVG, size));
  }
  writeFileSync(`${APP_DIR}/favicon.ico`, buildIco(icoPngs, icoSizes));

  await sharp(Buffer.from(FULLBLEED_SVG)).resize(180, 180).png().toFile(`${APP_DIR}/apple-icon.png`);

  await sharp(Buffer.from(ROUNDED_SVG)).resize(192, 192).png().toFile(`${PUBLIC_ICONS}/icon-192.png`);
  await sharp(Buffer.from(ROUNDED_SVG)).resize(512, 512).png().toFile(`${PUBLIC_ICONS}/icon-512.png`);
  await sharp(Buffer.from(MASKABLE_SVG)).resize(192, 192).png().toFile(`${PUBLIC_ICONS}/maskable-192.png`);
  await sharp(Buffer.from(MASKABLE_SVG)).resize(512, 512).png().toFile(`${PUBLIC_ICONS}/maskable-512.png`);

  console.log("Icons generated: favicon.ico, apple-icon.png, icon-192/512, maskable-192/512");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
