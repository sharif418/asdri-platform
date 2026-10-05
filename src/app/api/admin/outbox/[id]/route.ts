import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({ action: z.literal("resend") });

/**
 * PATCH /api/admin/outbox/[id] — re-queue an email for the smtp driver:
 * sentAt/error are cleared so the worker picks it up again. Under the log
 * driver the row itself is the delivery record, so this simply marks it
 * queued once more.
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const email = await db.outboxEmail.findUnique({ where: { id } });
  if (!email) return NextResponse.json({ ok: false, error: "ইমেইলটি পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "যাচাই করুন।" }, { status: 400 });
  }

  await db.outboxEmail.update({ where: { id }, data: { sentAt: null, error: null } });
  await audit(
    guard.session.user.id,
    "outbox.resend",
    "OutboxEmail",
    id,
    { before: { sentAt: email.sentAt?.toISOString() ?? null, to: email.to }, after: { queued: true } },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true, data: { queued: true } });
}
