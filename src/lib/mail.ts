import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Mail outbox — the platform's single send path.
 *
 * MAIL_DRIVER=log (the sandbox default) persists every message as an
 * OutboxEmail row, unsent: inspectable in dev, re-sendable from the admin
 * later. The production smtp driver will deliver first and then record the
 * same row, so callers never branch on the driver.
 */

export interface OutboxEmailInput {
  to: string;
  subject: string;
  /** Plain-text fallback / admin preview body. */
  body: string;
  /** HTML body rendered by mail clients. */
  html: string;
  /** Template key, e.g. "donation.receipt". */
  kind: string;
  /** Template data kept on the row (re-send, audit). */
  payload?: Record<string, unknown>;
}

/** Queue one email in the outbox (log driver — persisted, not delivered). */
export async function queueOutboxEmail(input: OutboxEmailInput): Promise<void> {
  await db.outboxEmail.create({
    data: {
      to: input.to,
      subject: input.subject,
      body: input.body,
      html: input.html,
      kind: input.kind,
      payload: input.payload as Prisma.InputJsonValue | undefined,
    },
  });
}

export interface DonationReceiptInput {
  to: string;
  receiptNo: string;
  trackingCode: string;
  /** English fund name (the emailed receipt language, per PLAN §6). */
  fundName: string;
  amount: number;
  currency: string;
  donorName: string;
  paidAt: Date;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * English donation receipt email (PDF receipts are English; the Bangla
 * receipt is the in-app print view — see PLAN §6 decisions).
 */
export function buildDonationReceiptEmail(donation: DonationReceiptInput): OutboxEmailInput {
  const amountLabel = `${donation.currency} ${donation.amount.toLocaleString("en-US")}`;
  const dateLabel = donation.paidAt.toISOString().slice(0, 10);
  const row = (label: string, value: string): string =>
    `<tr><td style="padding:6px 14px;color:#5f6b5f;font-size:13px;border-bottom:1px solid #e6e9e3">${label}</td>` +
    `<td style="padding:6px 14px;font-size:13px;font-weight:600;border-bottom:1px solid #e6e9e3">${escapeHtml(value)}</td></tr>`;

  const html =
    `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;border:1px solid #e6e9e3;border-radius:12px;overflow:hidden">` +
    `<div style="background:#0f5132;padding:20px 28px"><p style="margin:0;color:#d4af37;font-size:11px;letter-spacing:2px;text-transform:uppercase">As-Sunnah Dawah &amp; Research Institute</p>` +
    `<p style="margin:4px 0 0;color:#ffffff;font-size:18px;font-weight:700">Donation Receipt</p></div>` +
    `<div style="padding:24px 12px"><table style="width:100%;border-collapse:collapse">` +
    row("Receipt No.", donation.receiptNo) +
    row("Tracking Code", donation.trackingCode) +
    row("Fund", donation.fundName) +
    row("Amount", amountLabel) +
    row("Donor", donation.donorName) +
    row("Date", dateLabel) +
    `</table>` +
    `<p style="margin:20px 14px 0;color:#5f6b5f;font-size:12px;line-height:1.7">Jazakallahu Khairan for your contribution. ` +
    `Every donation is transparently accounted for and reported. Please keep this receipt for your records.</p></div>` +
    `<div style="background:#f6f7f4;padding:14px 28px;color:#8a938a;font-size:11px">Satarkul Badda, Dhaka-1212, Bangladesh &middot; info@assunnah-institute.org</div></div>`;

  const body =
    `As-Sunnah Dawah & Research Institute — Donation Receipt\n\n` +
    `Receipt No.: ${donation.receiptNo}\n` +
    `Tracking Code: ${donation.trackingCode}\n` +
    `Fund: ${donation.fundName}\n` +
    `Amount: ${amountLabel}\n` +
    `Donor: ${donation.donorName}\n` +
    `Date: ${dateLabel}\n\n` +
    `Jazakallahu Khairan for your contribution. Every donation is transparently accounted for and reported.\n`;

  return {
    to: donation.to,
    subject: `Donation Receipt ${donation.receiptNo} — As-Sunnah Institute`,
    body,
    html,
    kind: "donation.receipt",
    payload: {
      receiptNo: donation.receiptNo,
      trackingCode: donation.trackingCode,
      fundName: donation.fundName,
      amount: donation.amount,
      currency: donation.currency,
    },
  };
}
