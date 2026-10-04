import { db } from "@/lib/db";

/** Lowercase slug from an English title: non-alnum → hyphen, trimmed, capped. */
export function slugifyTitle(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/**
 * Guarantee slug uniqueness by appending -2, -3… (timestamp fallback after 25
 * tries) against the FatwaEntry table.
 */
export async function buildUniqueFatwaSlug(base: string): Promise<string> {
  let candidate = base;
  for (let attempt = 2; attempt <= 25; attempt++) {
    const existing = await db.fatwaEntry.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${base}-${attempt}`;
  }
  return `${base}-${Date.now()}`;
}

/** True when the text contains Bengali script codepoints (U+0980–U+09FF). */
export function containsBengali(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}
