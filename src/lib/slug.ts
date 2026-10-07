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
 * tries). The existence check is caller-supplied so every admin module can
 * probe its own table — Bangla-only titles no longer collide on a constant
 * fallback slug (round 4, C2).
 */
export async function buildUniqueSlug(base: string, exists: (candidate: string) => Promise<boolean>): Promise<string> {
  let candidate = base;
  for (let attempt = 2; attempt <= 25; attempt++) {
    if (!(await exists(candidate))) return candidate;
    candidate = `${base}-${attempt}`;
  }
  return `${base}-${Date.now()}`;
}

/** FatwaEntry flavour of {@link buildUniqueSlug} (thin wrapper). */
export async function buildUniqueFatwaSlug(base: string): Promise<string> {
  return buildUniqueSlug(base, async (candidate) => {
    const existing = await db.fatwaEntry.findUnique({ where: { slug: candidate }, select: { id: true } });
    return !!existing;
  });
}

/** True when the text contains Bengali script codepoints (U+0980–U+09FF). */
export function containsBengali(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

/** Generic slug builder used across admin modules (alias kept for clarity). */
export function slugify(text: string): string {
  return slugifyTitle(text) || `n-${Date.now().toString(36)}`;
}
