import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { donationStatusSchema, zodFields } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/donations/[id] — transition an intent initiated ↔ completed (admin-only). */
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

  const parsed = donationStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    const existing = await db.donationIntent.findUnique({
      where: { id },
      select: { id: true, receiptNo: true, status: true, amount: true },
    });
    if (!existing) return jsonError("অনুদান রেকর্ডটি পাওয়া যায়নি", "NOT_FOUND", 404);

    const { status } = parsed.data;

    if (existing.status === status) {
      return jsonOk({ id: existing.id, status, message: "স্ট্যাটাস ইতিমধ্যে একই — কোনো পরিবর্তন হয়নি" });
    }

    const updated = await db.donationIntent.update({
      where: { id },
      data: { status },
      select: { id: true, receiptNo: true, status: true },
    });

    await logAdminAction({
      actor: session,
      action: "donation.status",
      entityRef: updated.receiptNo,
      summaryBn:
        status === "completed"
          ? `অনুদান “সম্পন্ন” হিসেবে চিহ্নিত হয়েছে: রসিদ ${updated.receiptNo}`
          : `অনুদান পুনরায় “অপেক্ষমাণ” করা হয়েছে: রসিদ ${updated.receiptNo}`,
    });

    return jsonOk({ id: updated.id, status: updated.status, message: "অনুদান স্ট্যাটাস হালনাগাদ হয়েছে" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("অনুদান রেকর্ডটি পাওয়া যায়নি", "NOT_FOUND", 404);
    }
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
