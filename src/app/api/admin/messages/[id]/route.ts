import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { contactStatusUpdateSchema, zodFields } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/messages/[id] — update inbox status (new | read | replied). */
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

  const parsed = contactStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    const existing = await db.contactMessage.findUnique({
      where: { id },
      select: { id: true, subject: true, status: true },
    });
    if (!existing) return jsonError("বার্তাটি পাওয়া যায়নি", "NOT_FOUND", 404);

    const updated = await db.contactMessage.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });

    await logAdminAction({
      actor: session,
      action: "message.status",
      entityRef: id,
      summaryBn: `বার্তার স্ট্যাটাস “${existing.subject.slice(0, 60)}” → ${updated.status === "read" ? "পঠিত" : "উত্তরপ্রাপ্ত"}`,
    });

    return jsonOk({ id: updated.id, status: updated.status, message: "স্ট্যাটাস হালনাগাদ হয়েছে" });
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}

/** DELETE /api/admin/messages/[id] — remove an inbox message (admin-only). */
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
    const existing = await db.contactMessage.findUnique({
      where: { id },
      select: { id: true, subject: true },
    });
    if (!existing) return jsonError("বার্তাটি পাওয়া যায়নি", "NOT_FOUND", 404);

    await db.contactMessage.delete({ where: { id } });

    await logAdminAction({
      actor: session,
      action: "message.delete",
      entityRef: id,
      summaryBn: `বার্তা মুছে ফেলা হয়েছে: “${existing.subject.slice(0, 60)}”`,
    });

    return jsonOk({ message: "বার্তাটি মুছে ফেলা হয়েছে" });
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
