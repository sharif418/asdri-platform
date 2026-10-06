import { NextRequest, NextResponse } from "next/server";
import { getClientIp, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { listCampaigns } from "@/lib/content/campaigns";

export const dynamic = "force-dynamic";

/** Consumers: support page campaigns band (client fetch) + external readers.
 *  30s cache. (The homepage support section now reads the DB in its server
 *  component — src/lib/content/campaigns.ts.) */
const CACHE_CONTROL = "public, max-age=0, s-maxage=30, stale-while-revalidate=60";

/** GET /api/campaigns — published funding campaigns with live progress. */
export async function GET(request: NextRequest): Promise<NextResponse> {
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
    const campaigns = await listCampaigns();
    const response = jsonOk(campaigns);
    response.headers.set("Cache-Control", CACHE_CONTROL);
    return response;
  } catch {
    return jsonError("ক্যাম্পেইন লোড করা যায়নি", "SERVER", 500);
  }
}
