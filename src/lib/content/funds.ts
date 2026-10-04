import { db } from "@/lib/db";
import type { FundType, LocalizedText } from "@/types";

/**
 * DB → view-model adapter for the donation funds (Fund table). The keys match
 * the FundType union so client components can keep their Record lookups.
 */

export interface FundView {
  key: FundType;
  title: LocalizedText;
  description: LocalizedText;
}

const FUND_TYPE_KEYS = ["zakat", "general", "scholarship", "sponsor"] as const;

function isFundType(value: string): value is FundType {
  return (FUND_TYPE_KEYS as readonly string[]).includes(value);
}

/** Enabled funds in display order (key, title, description). */
export async function getFunds(): Promise<FundView[]> {
  const rows = await db.fund.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: "asc" },
    select: { key: true, nameBn: true, nameEn: true, descriptionBn: true, descriptionEn: true },
  });
  const views: FundView[] = [];
  for (const row of rows) {
    if (!isFundType(row.key)) continue;
    views.push({
      key: row.key,
      title: { bn: row.nameBn, en: row.nameEn || row.nameBn },
      description: { bn: row.descriptionBn, en: row.descriptionEn || row.descriptionBn },
    });
  }
  return views;
}

/** Static labels used when a fund row is missing (fail-open, never a crash). */
export const FUND_LABEL_FALLBACKS: Record<FundType, { bn: string; en: string }> = {
  zakat: { bn: "যাকাত ফান্ড", en: "Zakat Fund" },
  sponsor: { bn: "শিক্ষার্থী স্পন্সর", en: "Sponsor a Student" },
  general: { bn: "সাধারণ অনুদান", en: "General Donation" },
  scholarship: { bn: "স্কলারশিপ ফান্ড", en: "Scholarship Fund" },
};

/** Record<FundType, label> merged from the DB with static fallbacks. */
export async function getFundLabels(): Promise<Record<FundType, { bn: string; en: string }>> {
  const funds = await getFunds();
  const labels: Record<FundType, { bn: string; en: string }> = { ...FUND_LABEL_FALLBACKS };
  for (const fund of funds) {
    labels[fund.key] = { bn: fund.title.bn, en: fund.title.en };
  }
  return labels;
}
