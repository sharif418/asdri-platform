import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { isFeatureEnabled } from "@/lib/settings";
import type { FundingCampaign } from "@/types";

export const dynamic = "force-dynamic";

/** Consumers: homepage support section + support page campaigns band. 30s cache. */
const CACHE_CONTROL = "public, max-age=0, s-maxage=30, stale-while-revalidate=60";

/** GET /api/campaigns — published funding campaigns with live progress.
 *
 * `raisedAmount` is computed, never stored: the sum of COMPLETED donations
 * linked to the campaign (the honest number — a pending donation has not
 * arrived yet). Ordered by the office's `sortOrder`, then age.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await isFeatureEnabled("donations"))) {
    return jsonOk([]);
  }

  const limiter = rateLimit({
    key: "campaigns-read",
    identifier: getClientIp(request),
    limit: 60,
    windowMs: 60_000,
  });
  if (!limiter.ok) {
    return jsonError("অনেকবার অনুরোধ পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  try {
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

    const campaigns: FundingCampaign[] = rows.map((row) => ({
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

    const response = jsonOk(campaigns);
    response.headers.set("Cache-Control", CACHE_CONTROL);
    return response;
  } catch {
    return jsonError("ক্যাম্পেইন লোড করা যায়নি", "SERVER", 500);
  }
}
