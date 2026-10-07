import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/library/readings — the reader's read counter.
 *
 * The client posts { itemId, page } whenever the reader moves FORWARD past
 * the last page they had seen (the record page records its own row per
 * view). Sessions are optional — anonymous reads count too — and the page
 * number is validated but not persisted: LibraryReading is a per-open
 * counter the admin stats aggregate, and one row per viewed page keeps the
 * "how far did people read" signal without a schema change.
 *
 * Guards: same-origin (counter CSRF is meaningless, but the header check is
 * free), 30 posts/minute/IP (a reader turning pages quickly, not a bot),
 * and the item must exist and be published.
 */

const readingSchema = z.object({
  itemId: z.string().trim().min(10).max(64),
  page: z.number().int().min(1).max(100_000).optional(),
});

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { ok: false, error: "অনুমোদিত নয়।" },
      { status: 403 },
    );
  }

  const limiter = rateLimit({
    key: "library-readings",
    identifier: getClientIp(request),
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS,
  });
  if (!limiter.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "অনেকবার গণনা পাঠানো হয়েছে — কিছুক্ষণ পর আবার চেষ্টা করুন।",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limiter.retryAfterSec) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" },
      { status: 400 },
    );
  }

  const parsed = readingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "গণনার তথ্য সঠিক নয়।" },
      { status: 400 },
    );
  }

  const item = await db.libraryItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { id: true, isPublished: true },
  });
  if (!item || !item.isPublished) {
    return NextResponse.json(
      { ok: false, error: "আইটেমটি পাওয়া যায়নি।" },
      { status: 404 },
    );
  }

  await db.libraryReading.create({ data: { itemId: item.id } });

  return NextResponse.json(
    { ok: true, data: { recorded: true } },
    { status: 201 },
  );
}
