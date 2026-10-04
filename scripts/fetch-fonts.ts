/**
 * Download subset woff2 files from Google Fonts and emit a local @font-face
 * stylesheet. Run once; output committed under src/fonts/ (no network needed
 * at build time — true self-hosting).
 *
 *   bun scripts/fetch-fonts.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const FAMILIES = [
  "family=Tiro+Bangla",
  "family=Hind+Siliguri:wght@300;400;500;600;700",
  "family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600",
  "family=Amiri:wght@400;700",
];

const OUT_DIR = path.join(process.cwd(), "src", "fonts");
const cssUrl = `https://fonts.googleapis.com/css2?${FAMILIES.join("&")}&display=swap`;

const res = await fetch(cssUrl, { headers: { "User-Agent": UA } });
const css = await res.text();

// collect @font-face blocks with their subset comment
const blocks: Array<{ subset: string; block: string }> = [];
const commentRe = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g;
let m: RegExpExecArray | null;
while ((m = commentRe.exec(css))) {
  blocks.push({ subset: m[1], block: m[2] });
}

// keep only the subsets we actually use: bengali, latin, arabic
const KEEP = new Set(["bengali", "latin", "arabic", "latin-ext"]);
const seen = new Set<string>();
let outCss = "";
let count = 0;

for (const { subset, block } of blocks) {
  if (!KEEP.has(subset)) continue;
  const urlMatch = block.match(/url\((https:\/\/[^)]+\.woff2)\)/);
  const familyMatch = block.match(/font-family:\s*'([^']+)'/);
  const styleMatch = block.match(/font-style:\s*(\w+)/);
  const weightMatch = block.match(/font-weight:\s*(\d+)/);
  if (!urlMatch || !familyMatch || !styleMatch || !weightMatch) continue;

  const url = urlMatch[1];
  const family = familyMatch[1].replace(/\s+/g, "");
  const style = styleMatch[1];
  const weight = weightMatch[1];
  const file = `${family}-${weight}-${style}-${subset}.woff2`;
  if (seen.has(file)) continue;
  seen.add(file);

  const bin = await (await fetch(url)).arrayBuffer();
  await writeFile(path.join(OUT_DIR, file), Buffer.from(bin));
  count++;

  outCss += `/* ${subset} */\n@font-face {\n  font-family: '${familyMatch[1]}';\n  font-style: ${style};\n  font-weight: ${weight};\n  font-display: swap;\n  src: url('./${file}') format('woff2');\n  unicode-range: ${block.match(/unicode-range:\s*([^;]+);/)?.[1] ?? ""};\n}\n\n`;
}

await writeFile(path.join(OUT_DIR, "fonts.css"), outCss);
console.log(`Downloaded ${count} subset files for ${seen.size} faces.`);
