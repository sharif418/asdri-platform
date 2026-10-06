import { NextRequest, NextResponse } from "next/server";
import { getClientIp, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { NOTICE_CATEGORIES } from "@/types";
import { listNotices } from "@/lib/content/notices";

export const dynamic = "force-dynamic";

/** Consumers: ⌘K palette live search + external readers. 30s shared cache.
 *  (The homepage feed itself now reads the DB in its server component —
 *  src/lib/content/notices.ts — this route remains for the palette/API.) */
const CACHE_CONTROL = "public, max-age=0, s-maxage=30, stale-while-revalidate=60";
const CATEGORY_VALUES: readonly string[] = ["all", ...NOTICE_CATEGORIES];

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** GET /api/notices?category=&q=&page=&pageSize= — published notice feed.
 *
 * Pinned notices lead (site-wide editorial curation), then newest first.
 * Status is not filtered — a CLOSED notice stays on the board as history;
 * the `status` field lets clients render the badge.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const limiter = rateLimit({
    key: "notices-read",
    identifier: getClientIp(request),
    limit: 60,
    windowMs: 60_000,
  });
  if (!limiter.ok) {
    return jsonError("অনেকবার অনুরোধ পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন", "RATE_LIMIT", 429);
  }

  const params = request.nextUrl.searchParams;
  const category = (params.get("category") ?? "").trim().toLowerCase();
  const q = (params.get("q") ?? "").trim().slice(0, 120);
  const page = Math.max(1, parsePositiveInt(params.get("page"), 1));
  const pageSize = Math.min(50, Math.max(1, parsePositiveInt(params.get("pageSize"), 12)));

  if (category && !CATEGORY_VALUES.includes(category)) {
    return jsonError("অজানা ক্যাটেগরি", "VALIDATION", 400, {
      category: "ক্যাটেগরি all, admission, academic, recruitment বা general হতে হবে",
    });
  }

  try {
    const result = await listNotices({ category, q, page, pageSize });
    const response = jsonOk({ items: result.items, total: result.total, page: result.page, pageSize: result.pageSize });
    response.headers.set("Cache-Control", CACHE_CONTROL);
    return response;
  } catch {
    return jsonError("নোটিশ লোড করা যায়নি", "SERVER", 500);
  }
}
