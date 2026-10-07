/**
 * Icon pipeline — rasterises the official mark (public/brand/mark.webp, see src/lib/brand.ts)
 * into every favicon / PWA artifact the app serves:
 *   - src/app/icon.png          (512, transparent, padded — the browser favicon)
 *   - src/app/apple-icon.png    (180, white ground — iOS applies its own mask)
 *   - src/app/favicon.ico       (16 + 32 + 48 PNG-embedded ICO, legacy UAs)
 *   - public/icons/icon-*.png   (192/512 "any") and maskable-*.png (safe-zone padded, white)
 *
 * Run: bun run scripts/generate-icons.ts   (after replacing public/brand/mark.webp)
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const MARK = "public/brand/mark.webp";
const APP_DIR = "src/app";
const PUBLIC_ICONS = "public/icons";

async function square(size: number, pad: number, background: { r: number; g: number; b: number; alpha: number }) {
  const inner = size - pad * 2;
  const mark = await sharp(MARK).resize(inner, inner, { fit: "inside" }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toBuffer();
}

/** ICO container with PNG-encoded entries (supported by every current browser). */
function buildIco(entries: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o);
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(e.png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.png.length;
  });
  return Buffer.concat([header, dir, ...entries.map((e) => e.png)]);
}

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const white = { r: 255, g: 255, b: 255, alpha: 1 };

mkdirSync(PUBLIC_ICONS, { recursive: true });
writeFileSync(`${APP_DIR}/icon.png`, await square(512, 40, transparent));
writeFileSync(`${APP_DIR}/apple-icon.png`, await sharp(await square(180, 18, white)).flatten({ background: "#ffffff" }).png().toBuffer());
writeFileSync(`${PUBLIC_ICONS}/icon-192.png`, await square(192, 15, transparent));
writeFileSync(`${PUBLIC_ICONS}/icon-512.png`, await square(512, 40, transparent));
writeFileSync(`${PUBLIC_ICONS}/maskable-192.png`, await square(192, 38, white));
writeFileSync(`${PUBLIC_ICONS}/maskable-512.png`, await square(512, 100, white));
const ico = await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await square(size, Math.round(size * 0.06), transparent) })));
writeFileSync(`${APP_DIR}/favicon.ico`, buildIco(ico));
writeFileSync("public/favicon.ico", buildIco(ico));
console.log("Icons generated from public/brand/mark.webp: icon.png, apple-icon.png, favicon.ico, icons/192+512 (+maskable)");
