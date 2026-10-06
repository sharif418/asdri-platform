import { db } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/settings";
import type { FundingCampaign } from "@/types";

/** Shared published-campaign query: homepage support section + /api/campaigns. */

/**
 * Published funding campaigns with live progress.
 *
 * `raisedAmount` is computed, never stored: the sum of COMPLETED donations
 * linked to the campaign (the honest number — a pending donation has not
 * arrived yet). Ordered by the office's `sortOrder`, then age.
 * When the donations feature flag is off the list is empty.
 */
export async function listCampaigns(): Promise<FundingCampaign[]> {
  if (!(await isFeatureEnabled("donations"))) {
    return [];
  }

  const now = new Date();
  const [rows, raised] = await Promise.all([
    db.campaign.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        slug: true,
        titleBn: true,
        titleEn: true,
        descriptionBn: true,
        descriptionEn: true,
        goalAmount: true,
        endsAt: true,
        isPublished: true,
      },
    }),
    db.donation.groupBy({
      by: ["campaignId"],
      where: { status: "COMPLETED", campaignId: { not: null } },
      _sum: { amount: true },
    }),
  ]);

  const raisedByCampaign = new Map<string, number>();
  for (const group of raised) {
    if (group.campaignId) raisedByCampaign.set(group.campaignId, group._sum.amount ?? 0);
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: { bn: row.titleBn, en: row.titleEn },
    description: { bn: row.descriptionBn, en: row.descriptionEn },
    targetAmount: row.goalAmount,
    raisedAmount: raisedByCampaign.get(row.id) ?? 0,
    currency: "BDT",
    deadline: row.endsAt ? row.endsAt.toISOString() : null,
    active: row.isPublished && (!row.endsAt || row.endsAt >= now),
  }));
}
