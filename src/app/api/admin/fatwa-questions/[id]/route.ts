import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sanitizeRichText } from "@/lib/sanitize";
import { fatwaQuestionPatchSchema } from "@/lib/validators/admin-fatwa";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "অপেক্ষমাণ",
  ANSWERED: "উত্তরপ্রাপ্ত",
  PUBLISHED: "প্রকাশিত",
  REJECTED: "বাতিল",
};

/**
 * PATCH /api/admin/fatwa-questions/[id] — answer or change the status of an
 * inbox question (ADMIN, FATWA, EDITOR). Answering stamps the answerer and
 * time; rejecting keeps an office note.
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "fatwa");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.fatwaQuestion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "জিজ্ঞাসাটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = fatwaQuestionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "ফর্মের তথ্য যাচাই করুন।",
        fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const answer = data.answer !== undefined ? sanitizeRichText(data.answer) : undefined;
  const finalAnswer = answer !== undefined ? answer : existing.answer ?? "";

  if (data.status === "ANSWERED" && finalAnswer.trim().length === 0) {
    return NextResponse.json(
      { ok: false, error: "উত্তর লিখে তারপর সংরক্ষণ করুন।", fields: { answer: "উত্তর খালি" } },
      { status: 400 },
    );
  }
  if (data.status === "PUBLISHED" && existing.publishedSlug === null) {
    return NextResponse.json(
      { ok: false, error: "প্রকাশের জন্য ফতোয়া ব্যাংকে পাঠান — এখান থেকে সরাসরি প্রকাশ করা যায় না।" },
      { status: 400 },
    );
  }

  const question = await db.fatwaQuestion.update({
    where: { id },
    data: {
      ...(answer !== undefined ? { answer } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.note !== undefined ? { note: data.note || null } : {}),
      ...(data.status === "ANSWERED"
        ? { answeredById: guard.session.user.id, answeredAt: new Date() }
        : answer !== undefined && finalAnswer.trim().length > 0 && existing.answeredById === null
          ? { answeredById: guard.session.user.id, answeredAt: new Date() }
          : {}),
    },
  });

  await audit(
    guard.session.user.id,
    data.status === "REJECTED" ? "fatwaQuestion.reject" : "fatwaQuestion.answer",
    "FatwaQuestion",
    question.id,
    {
      before: { reference: existing.reference, status: STATUS_LABELS[existing.status] ?? existing.status },
      after: { reference: question.reference, status: STATUS_LABELS[question.status] ?? question.status, note: question.note ?? "" },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { status: question.status } });
}
