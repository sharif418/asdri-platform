import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, jsonError, jsonOk, rateLimit } from "@/lib/security";
import type { FundingCampaign } from "@/types";

export const dynamic = "force-dynamic";

/** GET /api/campaigns — active funding campaigns with live progress. */
export async function GET(request: Request): Promise<NextResponse> {
  const limiter = rateLimit({
    key: "campaigns-read",
    identifier: getClientIp(request),
    limit: 60,
    windowMs: 60_000,
  });
  if (!limiter.ok) {
    return jsonError("Too many requests", "RATE_LIMIT", 429);
  }

  try {
    const rows = await db.fundingCampaign.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        titleBn: true,
        titleEn: true,
        descriptionBn: true,
        descriptionEn: true,
        targetAmount: true,
        raisedAmount: true,
        currency: true,
        deadline: true,
      },
    });

    const campaigns: FundingCampaign[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: { bn: row.titleBn, en: row.titleEn },
      description: { bn: row.descriptionBn, en: row.descriptionEn },
      targetAmount: row.targetAmount,
      raisedAmount: row.raisedAmount,
      currency: "BDT",
      deadline: row.deadline ? row.deadline.toISOString() : null,
      active: true,
    }));

    return jsonOk(campaigns);
  } catch {
    return jsonError("Failed to load campaigns", "SERVER", 500);
  }
}
