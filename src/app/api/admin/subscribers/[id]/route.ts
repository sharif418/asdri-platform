import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** DELETE /api/admin/subscribers/[id] — remove a newsletter subscriber (admin-only). */
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
    const existing = await db.newsletterSubscriber.findUnique({ where: { id }, select: { id: true, email: true } });
    if (!existing) return jsonError("সাবস্ক্রাইবারটি পাওয়া যায়নি", "NOT_FOUND", 404);

    await db.newsletterSubscriber.delete({ where: { id } });

    await logAdminAction({
      actor: session,
      action: "subscriber.delete",
      entityRef: existing.email,
      summaryBn: `সাবস্ক্রাইবার তালিকা থেকে সরানো হয়েছে: ${existing.email}`,
    });

    return jsonOk({ message: "সাবস্ক্রাইবার তালিকা থেকে সরানো হয়েছে" });
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
