import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { buildDonationReceiptEmail, queueOutboxEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/donations/[id] — the finance officer's ledger actions.
 *
 * - `status` transitions: COMPLETED (manual payment received — bKash etc.),
 *   FAILED, REFUNDED. Manual completions record a "manual" PaymentTransaction
 *   event and (when the donor left an email) queue the English receipt.
 * - `action: "resend_receipt"` re-queues the receipt email for a COMPLETED
 *   donation (audit: donation.resend).
 *
 * Guards: a COMPLETED donation is never downgraded; REFUNDED is only reachable
 * from COMPLETED; FAILED only from PENDING.
 */
const patchSchema = z.union([
  z.object({
    status: z.enum(["COMPLETED", "FAILED", "REFUNDED"]),
    note: z.string().trim().max(400).default(""),
  }),
  z.object({
    action: z.literal("resend_receipt"),
  }),
]);

export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const donation = await db.donation.findUnique({ where: { id }, include: { fund: true } });
  if (!donation) return NextResponse.json({ ok: false, error: "অনুদানটি পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "যাচাই করুন।",
        fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])),
      },
      { status: 400 },
    );
  }

  const ip = request.headers.get("x-real-ip");

  // ——— resend receipt (only for COMPLETED donations with a donor email) ———
  if ("action" in parsed.data) {
    if (donation.status !== "COMPLETED") {
      return NextResponse.json({ ok: false, error: "শুধুমাত্র সম্পন্ন অনুদানের রিসিপ্ট পাঠানো যায়।" }, { status: 409 });
    }
    if (!donation.donorEmail) {
      return NextResponse.json({ ok: false, error: "এই অনুদানে দাতার ইমেইল নেই।" }, { status: 409 });
    }
    await queueOutboxEmail(
      buildDonationReceiptEmail({
        to: donation.donorEmail,
        receiptNo: donation.receiptNo ?? donation.trackingCode,
        trackingCode: donation.trackingCode,
        fundName: donation.fund.nameEn || donation.fund.nameBn,
        amount: donation.amount,
        currency: donation.currency,
        donorName: donation.donorName,
        paidAt: donation.paidAt ?? donation.updatedAt,
      }),
    );
    await db.donation.update({ where: { id }, data: { receiptSentAt: new Date() } });
    await audit(guard.session.user.id, "donation.resend", "Donation", id, { after: { receiptNo: donation.receiptNo, to: donation.donorEmail } }, ip);
    return NextResponse.json({ ok: true, data: { resent: true } });
  }

  // ——— status transitions ———
  const target = parsed.data.status;
  if (donation.status === target) {
    return NextResponse.json({ ok: false, error: "অনুদানটি ইতিমধ্যেই এই অবস্থায় আছে।" }, { status: 409 });
  }
  const transitionValid =
    (target === "COMPLETED" && (donation.status === "PENDING" || donation.status === "FAILED")) ||
    (target === "FAILED" && donation.status === "PENDING") ||
    (target === "REFUNDED" && donation.status === "COMPLETED");
  if (!transitionValid) {
    return NextResponse.json({ ok: false, error: "এই অবস্থা থেকে সেই স্ট্যাটাসে যাওয়া যায় না।" }, { status: 409 });
  }

  const now = new Date();
  const actorId = guard.session.user.id;

  if (target === "COMPLETED") {
    // Manual completion (bKash/Nagad handover) — record the "manual" payment event.
    await db.$transaction([
      db.donation.update({ where: { id }, data: { status: "COMPLETED", paidAt: now } }),
      db.paymentTransaction.create({
        data: {
          donationId: id,
          provider: donation.provider,
          event: "manual",
          signatureValid: false,
          rawPayload: { completedBy: actorId, note: parsed.data.note, channel: "manual" },
        },
      }),
    ]);
    // Queue the English receipt exactly like the signed callback path.
    if (donation.donorEmail) {
      await queueOutboxEmail(
        buildDonationReceiptEmail({
          to: donation.donorEmail,
          receiptNo: donation.receiptNo ?? donation.trackingCode,
          trackingCode: donation.trackingCode,
          fundName: donation.fund.nameEn || donation.fund.nameBn,
          amount: donation.amount,
          currency: donation.currency,
          donorName: donation.donorName,
          paidAt: now,
        }),
      );
      await db.donation.update({ where: { id }, data: { receiptSentAt: new Date() } });
    }
    await audit(guard.session.user.id, "donation.complete", "Donation", id, { before: { status: donation.status }, after: { status: "COMPLETED", note: parsed.data.note } }, ip);
    return NextResponse.json({ ok: true, data: { status: "COMPLETED" } });
  }

  if (target === "FAILED") {
    await db.donation.update({ where: { id }, data: { status: "FAILED" } });
    await db.paymentTransaction.create({
      data: {
        donationId: id,
        provider: donation.provider,
        event: "manual",
        signatureValid: false,
        rawPayload: { failedBy: actorId, note: parsed.data.note, channel: "manual" },
      },
    });
    await audit(guard.session.user.id, "donation.fail", "Donation", id, { before: { status: donation.status }, after: { status: "FAILED", note: parsed.data.note } }, ip);
    return NextResponse.json({ ok: true, data: { status: "FAILED" } });
  }

  // REFUNDED — a completed donation returned to the donor.
  await db.$transaction([
    db.donation.update({ where: { id }, data: { status: "REFUNDED" } }),
    db.paymentTransaction.create({
      data: {
        donationId: id,
        provider: donation.provider,
        event: "manual",
        signatureValid: false,
        rawPayload: { refundedBy: actorId, note: parsed.data.note, channel: "manual" },
      },
    }),
  ]);
  await audit(guard.session.user.id, "donation.refund", "Donation", id, { before: { status: donation.status }, after: { status: "REFUNDED", note: parsed.data.note } }, ip);
  return NextResponse.json({ ok: true, data: { status: "REFUNDED" } });
}
