import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { deliverOutboxEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({ action: z.enum(["resend", "retry"]) });

/**
 * PATCH /api/admin/outbox/[id]
 *   action=resend — re-queue for the smtp driver: sentAt/error are cleared
 *   so the worker picks it up again. Under the log driver the row itself is
 *   the delivery record, so this simply marks it queued once more.
 *   action=retry  — one immediate delivery attempt right now (shared code
 *   path with the queue-time send). Success stamps sentAt and clears the
 *   error; failure records the message and bumps `attempts`. Already-sent
 *   rows are refused (409) so a retry can never double-deliver.
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

  if (parsed.data.action === "retry") {
    if (email.sentAt) {
      return NextResponse.json(
        { ok: false, error: "ইমেইলটি ইতিমধ্যেই পাঠানো হয়েছে — আবার পাঠানো যাবে না।" },
        { status: 409 },
      );
    }

    const result = await deliverOutboxEmail(id);
    await audit(
      guard.session.user.id,
      "outbox.retry",
      "OutboxEmail",
      id,
      {
        before: { sentAt: email.sentAt, attempts: email.attempts, error: email.error },
        after: { sent: result.ok ? result.sent : false, attempts: result.ok ? result.attempts : email.attempts, error: result.ok ? result.error : null },
      },
      request.headers.get("x-real-ip"),
    );
    if (!result.ok) {
      // Unreachable in practice (existence + sentAt checked above), kept as
      // a precise safety net if the row changes between the two reads.
      return result.reason === "not-found"
        ? NextResponse.json({ ok: false, error: "ইমেইলটি পাওয়া যায়নি।" }, { status: 404 })
        : NextResponse.json(
            { ok: false, error: "ইমেইলটি ইতিমধ্যেই পাঠানো হয়েছে — আবার পাঠানো যাবে না।" },
            { status: 409 },
          );
    }
    return NextResponse.json({ ok: true, data: { sent: result.sent, attempts: result.attempts, error: result.error } });
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
