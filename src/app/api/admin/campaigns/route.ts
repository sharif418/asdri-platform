import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { campaignCreateSchema, zodFields } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit";
import { slugifyTitle } from "@/lib/slug";
import { formatTaka } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Slug-uniqueness attempts before giving up (-2, -3… appended to the base). */
const SLUG_MAX_ATTEMPTS = 10;

const SLUG_CONFLICT_MESSAGE = "স্লাগ তৈরি করা যায়নি, শিরোনাম পরিবর্তন করুন";

/**
 * Guarantee campaign slug uniqueness by appending -2, -3… Returns null when
 * all attempts are taken (caller then rejects with a friendly 409).
 */
async function buildUniqueCampaignSlug(base: string): Promise<string | null> {
  let candidate = base;
  for (let attempt = 2; attempt <= SLUG_MAX_ATTEMPTS; attempt++) {
    const existing = await db.fundingCampaign.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${base}-${attempt}`;
  }
  return null;
}

/** POST /api/admin/campaigns — create a new funding campaign (admin-only). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return jsonError("অনুমতি নেই", "UNAUTHORIZED", 403);

  if (!isSameOrigin(request)) return jsonError("Invalid origin", "UNAUTHORIZED", 403);

  const limiter = rateLimit({ key: "admin-write", identifier: getClientIp(request), limit: 30, windowMs: 60_000 });
  if (!limiter.ok) return jsonError("Too many requests", "RATE_LIMIT", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", "VALIDATION", 400);
  }

  const parsed = campaignCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  const { titleBn, titleEn, descriptionBn, descriptionEn, targetAmount, deadline } = parsed.data;

  // Slug comes from the English title — a title with no slug-friendly
  // characters cannot produce a unique URL slug.
  const base = slugifyTitle(titleEn);
  if (!base) return jsonError(SLUG_CONFLICT_MESSAGE, "CONFLICT", 409);

  try {
    const finalSlug = await buildUniqueCampaignSlug(base);
    if (!finalSlug) return jsonError(SLUG_CONFLICT_MESSAGE, "CONFLICT", 409);

    const campaign = await db.fundingCampaign.create({
      data: {
        slug: finalSlug,
        titleBn,
        titleEn,
        descriptionBn,
        descriptionEn,
        targetAmount,
        raisedAmount: 0,
        currency: "BDT",
        active: true,
        deadline: deadline ? new Date(deadline) : null,
      },
      select: {
        id: true,
        slug: true,
        titleBn: true,
        titleEn: true,
        descriptionBn: true,
        descriptionEn: true,
        targetAmount: true,
        deadline: true,
        createdAt: true,
      },
    });

    await logAdminAction({
      actor: session,
      action: "campaign.create",
      entityRef: campaign.slug,
      summaryBn: `নতুন ক্যাম্পেইন তৈরি: “${campaign.titleBn}” (লক্ষ্য ${formatTaka(targetAmount, "bn")})`,
    });

    return jsonOk(
      {
        id: campaign.id,
        slug: campaign.slug,
        titleBn: campaign.titleBn,
        titleEn: campaign.titleEn,
        descriptionBn: campaign.descriptionBn,
        descriptionEn: campaign.descriptionEn,
        targetAmount: campaign.targetAmount,
        deadline: campaign.deadline ? campaign.deadline.toISOString() : null,
        createdAt: campaign.createdAt.toISOString(),
        message: "ক্যাম্পেইন সফলভাবে তৈরি হয়েছে",
      },
      201,
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError(SLUG_CONFLICT_MESSAGE, "CONFLICT", 409);
    }
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
