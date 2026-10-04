import type { LocalizedText } from "@/types";

/**
 * Small HTML → view-model helpers shared by the content adapters. The office
 * edits rich HTML in the admin; the public site renders plain prose, so the
 * adapters split bilingual HTML into LocalizedText lists.
 */

/** Remove all tags and collapse whitespace. */
export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/** Match every block element of a tag name (e.g. <p>…</p>, <li>…</li>). */
function matchBlocks(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const out: string[] = [];
  for (const m of html.matchAll(re)) out.push(stripTags(m[1] ?? ""));
  return out.filter((s) => s.length > 0);
}

/** <p> blocks of bilingual HTML → aligned LocalizedText[] (longer list wins). */
export function splitParagraphs(bnHtml: string, enHtml: string): LocalizedText[] {
  return zipLists(matchBlocks(bnHtml, "p"), matchBlocks(enHtml, "p"));
}

/** <li> blocks of bilingual HTML lists → aligned LocalizedText[]. */
export function splitListItems(bnHtml: string, enHtml: string): LocalizedText[] {
  return zipLists(matchBlocks(bnHtml, "li"), matchBlocks(enHtml, "li"));
}

/** Zip two string lists into LocalizedText[]; falls back to single-line split. */
function zipLists(bn: string[], en: string[]): LocalizedText[] {
  if (bn.length === 0 && en.length === 0) return [];
  const len = Math.max(bn.length, en.length);
  const out: LocalizedText[] = [];
  for (let i = 0; i < len; i++) {
    out.push({ bn: bn[i] ?? "", en: en[i] ?? "" });
  }
  return out.filter((t) => t.bn || t.en);
}

/** Deterministic cover-image rotation for rows without media attached. */
export function rotateFallback(images: readonly string[], index: number): string {
  if (images.length === 0) return "";
  return images[index % images.length];
}
