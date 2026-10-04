import { db } from "@/lib/db";
import type { LocalizedText } from "@/types";

/**
 * DB → view-model adapters for the home page: the ordered, switchable section
 * list (HomeSection) and the urgent notice strip (newest pinned Notice).
 */

/** Enabled home section keys in display order (hero | stats | vision | …). */
export async function getHomeSections(): Promise<string[]> {
  const rows = await db.homeSection.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: "asc" },
    select: { key: true },
  });
  return rows.map((row) => row.key);
}

/** Newest pinned published notice for the urgent strip (title only). */
export async function getUrgentNotice(): Promise<{ slug: string; title: LocalizedText } | null> {
  const row = await db.notice.findFirst({
    where: { pinned: true, isPublished: true },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, titleBn: true, titleEn: true },
  });
  if (!row) return null;
  return { slug: row.slug, title: { bn: row.titleBn, en: row.titleEn || row.titleBn } };
}
