import { db } from "@/lib/db";
import { getVision } from "@/lib/settings";
import type { LocalizedText, StatItem } from "@/types";

/**
 * DB → view-model adapters for the impact figures ("এক নজরে" band) and the
 * vision statement / core pillars stored in the `site.vision` setting.
 */

const STAT_ICONS: readonly StatItem["icon"][] = [
  "students",
  "scholar",
  "general",
  "shortcourse",
  "enrolled",
  "alumni",
];

const PILLAR_ICONS = ["book-open", "git-merge", "sprout"] as const;

/** Impact-at-a-glance figures (iconKey → the view type's icon union). */
export async function getInstituteStats(): Promise<StatItem[]> {
  const rows = await db.stat.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, value: true, suffixBn: true, suffixEn: true, labelBn: true, labelEn: true, iconKey: true },
  });
  return rows.map((row, index) => {
    const icon = STAT_ICONS.includes(row.iconKey as StatItem["icon"])
      ? (row.iconKey as StatItem["icon"])
      : STAT_ICONS[index % STAT_ICONS.length];
    return {
      id: row.id,
      value: row.value,
      suffix: (row.suffixBn || row.suffixEn).trim() ? "+" : "",
      label: { bn: row.labelBn, en: row.labelEn || row.labelBn },
      icon,
    };
  });
}

/** Core vision statement — home + about pages. */
export async function getVisionStatement(): Promise<LocalizedText> {
  const vision = await getVision();
  return { bn: vision.statementBn, en: vision.statementEn || vision.statementBn };
}

/** Core pillars; icons rotate over the seed's three motifs. */
export async function getCorePillars(): Promise<
  { id: string; title: LocalizedText; description: LocalizedText; icon: string }[]
> {
  const vision = await getVision();
  return vision.pillars.map((pillar, index) => ({
    id: `pillar-${index + 1}`,
    title: { bn: pillar.titleBn, en: pillar.titleEn || pillar.titleBn },
    description: { bn: pillar.bodyBn, en: pillar.bodyEn || pillar.bodyBn },
    icon: PILLAR_ICONS[index % PILLAR_ICONS.length],
  }));
}
