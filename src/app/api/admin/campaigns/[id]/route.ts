import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { campaignUpdateSchema, zodFields } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit";
import { formatTaka } from "@/lib/format";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/campaigns/[id] — update campaign amounts, deadline, or active flag (admin-only). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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

  const parsed = campaignUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    const existing = await db.fundingCampaign.findUnique({
      where: { id },
      select: { id: true, slug: true, titleBn: true, deadline: true, active: true },
    });
    if (!existing) return jsonError("ক্যাম্পেইনটি পাওয়া যায়নি", "NOT_FOUND", 404);

    const { targetAmount, raisedAmount, deadline, active } = parsed.data;

    const data: Prisma.FundingCampaignUpdateInput = {};
    if (targetAmount !== undefined) data.targetAmount = targetAmount;
    if (raisedAmount !== undefined) data.raisedAmount = raisedAmount;
    if (deadline !== undefined) data.deadline = deadline === null ? null : new Date(deadline);
    if (active !== undefined) data.active = active;

    const updated = await db.fundingCampaign.update({
      where: { id },
      data,
      select: { id: true, slug: true, titleBn: true },
    });

    // Audit trail: amount/deadline edits → campaign.update; active toggle → campaign.status
    // (a combined payload logs both, so the timeline reflects each intent separately).
    if (targetAmount !== undefined || raisedAmount !== undefined || deadline !== undefined) {
      const parts: string[] = [];
      if (targetAmount !== undefined) parts.push(`নতুন লক্ষ্য ${formatTaka(targetAmount, "bn")}`);
      if (raisedAmount !== undefined) parts.push(`সংগৃহীত ${formatTaka(raisedAmount, "bn")}`);
      if (deadline !== undefined) parts.push(deadline === null ? "সময়সীমা বাতিল" : "সময়সীমা হালনাগাদ");
      await logAdminAction({
        actor: session,
        action: "campaign.update",
        entityRef: updated.slug,
        summaryBn: `ক্যাম্পেইন সম্পাদনা: “${updated.titleBn}” (${parts.join(" · ")})`,
      });
    }
    if (active !== undefined && active !== existing.active) {
      await logAdminAction({
        actor: session,
        action: "campaign.status",
        entityRef: updated.slug,
        summaryBn: `ক্যাম্পেইন ${active ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে: “${updated.titleBn}”`,
      });
    }

    return jsonOk({ id: updated.id, slug: updated.slug, message: "ক্যাম্পেইন সফলভাবে হালনাগাদ হয়েছে" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("ক্যাম্পেইনটি পাওয়া যায়নি", "NOT_FOUND", 404);
    }
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}

/**
 * DELETE /api/admin/campaigns/[id] — remove a campaign (admin-only).
 * Campaigns with any donation-intent history are protected: the ledger must
 * keep pointing at the fundraising drive it was recorded against.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return jsonError("অনুমতি নেই", "UNAUTHORIZED", 403);

  if (!isSameOrigin(request)) return jsonError("Invalid origin", "UNAUTHORIZED", 403);

  const limiter = rateLimit({ key: "admin-write", identifier: getClientIp(request), limit: 30, windowMs: 60_000 });
  if (!limiter.ok) return jsonError("Too many requests", "RATE_LIMIT", 429);

  const { id } = await params;

  try {
    const existing = await db.fundingCampaign.findUnique({
      where: { id },
      select: { id: true, slug: true, titleBn: true },
    });
    if (!existing) return jsonError("ক্যাম্পেইনটি পাওয়া যায়নি", "NOT_FOUND", 404);

    const intentCount = await db.donationIntent.count({ where: { campaignId: id } });
    if (intentCount > 0) {
      return jsonError("এই ক্যাম্পেইনে অনুদান রেকর্ড রয়েছে, তাই মুছে ফেলা যাবে না", "CONFLICT", 409);
    }

    await db.fundingCampaign.delete({ where: { id } });

    await logAdminAction({
      actor: session,
      action: "campaign.delete",
      entityRef: existing.slug,
      summaryBn: `ক্যাম্পেইন মুছে ফেলা হয়েছে: “${existing.titleBn}”`,
    });

    return jsonOk({ id, message: "ক্যাম্পেইন সফলভাবে মুছে ফেলা হয়েছে" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("ক্যাম্পেইনটি পাওয়া যায়নি", "NOT_FOUND", 404);
    }
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
