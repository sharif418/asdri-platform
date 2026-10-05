import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { deliverOutboxEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({ action: z.union([z.literal("resend"), z.literal("retry")]) });

/**
 * PATCH /api/admin/outbox/[id] — two finance actions on an outbox row:
 *
 * - `action: "resend"` (original): re-queue for the smtp worker — sentAt/error
 *   are cleared so a later pass picks it up. Under the log driver the row
 *   itself is the delivery record, so this simply marks it queued once more.
 * - `action: "retry"`: attempt delivery RIGHT NOW through the configured
 *   driver (smtp send, or log-driver "delivered = logged") — `attempts` is
 *   incremented and the updated row (sentAt/providerMessageId or the error)
 *   is returned. No background worker is involved.
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

  const ip = request.headers.get("x-real-ip");

  if (parsed.data.action === "retry") {
    // Deliver now: increments attempts, writes sentAt/providerMessageId or error.
    const updated = await deliverOutboxEmail(email);
    await audit(
      guard.session.user.id,
      "outbox.retry",
      "OutboxEmail",
      id,
      {
        before: { sentAt: email.sentAt?.toISOString() ?? null, attempts: email.attempts, error: email.error },
        after: { sentAt: updated.sentAt?.toISOString() ?? null, attempts: updated.attempts, error: updated.error },
      },
      ip,
    );
    return NextResponse.json({ ok: true, data: { email: updated } });
  }

  await db.outboxEmail.update({ where: { id }, data: { sentAt: null, error: null } });
  await audit(
    guard.session.user.id,
    "outbox.resend",
    "OutboxEmail",
    id,
    { before: { sentAt: email.sentAt?.toISOString() ?? null, to: email.to }, after: { queued: true } },
    ip,
  );
  return NextResponse.json({ ok: true, data: { queued: true } });
}
