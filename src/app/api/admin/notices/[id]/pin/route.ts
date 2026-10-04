import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { noticePinSchema, zodFields } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/notices/[id]/pin — toggle a notice's editorial pin (admin-only).
 * Non-destructive instant action: pinned notices surface above the regular board
 * flow on /notices and in the homepage feed curation.
 */
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

  const parsed = noticePinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  const { id } = await params;
  const { pinned } = parsed.data;

  try {
    const existing = await db.notice.findUnique({
      where: { id },
      select: { id: true, slug: true, titleBn: true, pinned: true },
    });
    if (!existing) return jsonError("নোটিশটি পাওয়া যায়নি", "NOT_FOUND", 404);

    // Same-state short-circuit: a no-op 200 without audit noise.
    if (existing.pinned === pinned) {
      return jsonOk({
        id: existing.id,
        slug: existing.slug,
        pinned,
        message: pinned ? "নোটিশটি ইতিমধ্যে পিন করা আছে" : "নোটিশটি ইতিমধ্যে আনপিন করা আছে",
      });
    }

    const updated = await db.notice.update({
      where: { id },
      data: { pinned },
      select: { id: true, slug: true, titleBn: true },
    });

    await logAdminAction({
      actor: session,
      action: pinned ? "notice.pin" : "notice.unpin",
      entityRef: updated.slug,
      summaryBn: pinned
        ? `নোটিশ পিন করা হয়েছে: “${updated.titleBn}”`
        : `নোটিশ আনপিন করা হয়েছে: “${updated.titleBn}”`,
    });

    return jsonOk({
      id: updated.id,
      slug: updated.slug,
      pinned,
      message: pinned ? "নোটিশ পিন করা হয়েছে" : "নোটিশ আনপিন করা হয়েছে",
    });
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
