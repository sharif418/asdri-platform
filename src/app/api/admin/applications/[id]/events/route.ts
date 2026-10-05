import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Note-only application events — the officer timeline without a status
 * change. Works at ANY status (including SUBMITTED), unlike the status
 * PATCH which must re-apply a transitionable status.
 */
const noteSchema = z.object({
  note: z.string().trim().min(1, "মন্তব্য লিখুন").max(400),
  reviewNote: z.string().trim().max(1000).optional(),
});

export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "admissions");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const application = await db.application.findUnique({ where: { id }, select: { id: true, status: true, trackingNo: true } });
  if (!application) return NextResponse.json({ ok: false, error: "আবেদন পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "যাচাই করুন।", fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])) },
      { status: 400 },
    );
  }

  const d = parsed.data;
  await db.$transaction([
    db.applicationEvent.create({
      data: { applicationId: id, status: application.status, note: d.note, actorId: guard.session.user.id },
    }),
    ...(d.reviewNote !== undefined
      ? [db.application.update({ where: { id }, data: { reviewNote: d.reviewNote } })]
      : []),
  ]);

  await audit(
    guard.session.user.id,
    "application.note",
    "Application",
    id,
    { after: { note: d.note, status: application.status } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { status: application.status } }, { status: 201 });
}
