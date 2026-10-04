import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getClientIp, isSameOrigin, jsonError, jsonOk, rateLimit } from "@/lib/security";
import { fatwaAnswerSchema, zodFields } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/fatwa-questions/[id] — record a board answer (admin-only). */
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

  const parsed = fatwaAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মের তথ্যগুলো যাচাই করুন", code: "VALIDATION", fields: zodFields(parsed.error) },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    const existing = await db.fatwaQuestion.findUnique({
      where: { id },
      select: { id: true, status: true, question: true, answer: true },
    });
    if (!existing) return jsonError("প্রশ্নটি পাওয়া যায়নি", "NOT_FOUND", 404);

    const updated = await db.fatwaQuestion.update({
      where: { id },
      data: { answer: parsed.data.answer, status: "answered", answeredAt: new Date() },
      select: { id: true, status: true },
    });

    await logAdminAction({
      actor: session,
      action: "fatwa.answer",
      entityRef: id,
      summaryBn:
        existing.status === "answered"
          ? `ফতোয়া উত্তর সম্পাদনা: “${existing.question.slice(0, 80)}…”`
          : `ফতোয়ার উত্তর লিখিত হয়েছে: “${existing.question.slice(0, 80)}…”`,
    });

    return jsonOk({ id: updated.id, status: updated.status, message: "উত্তর সংরক্ষিত হয়েছে" });
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}

/** DELETE /api/admin/fatwa-questions/[id] — remove a submitted question (admin-only). */
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
    const existing = await db.fatwaQuestion.findUnique({
      where: { id },
      select: { id: true, question: true, publishedSlug: true },
    });
    if (!existing) return jsonError("প্রশ্নটি পাওয়া যায়নি", "NOT_FOUND", 404);

    await db.fatwaQuestion.delete({ where: { id } });

    await logAdminAction({
      actor: session,
      action: "fatwa.delete",
      entityRef: existing.publishedSlug ?? id,
      summaryBn: `ফতোয়া প্রশ্ন মুছে ফেলা হয়েছে: “${existing.question.slice(0, 80)}…”`,
    });

    return jsonOk({ message: "প্রশ্নটি মুছে ফেলা হয়েছে" });
  } catch {
    return jsonError("সার্ভারে সমস্যা হয়েছে", "SERVER", 500);
  }
}
