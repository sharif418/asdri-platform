import type { Prisma } from "@prisma/client";
import type { Transporter } from "nodemailer";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Mail outbox — the platform's single send path.
 *
 * MAIL_DRIVER=log (the sandbox default) persists every message as an
 * OutboxEmail row, unsent: inspectable in dev, re-sendable from the admin
 * later. MAIL_DRIVER=smtp (server) delivers through SMTP first and then
 * records the same row with sentAt / providerMessageId — a send failure
 * keeps the row unsent with the error message, so nothing is lost and a
 * later pass can retry. Callers never branch on the driver.
 *
 * Every real delivery attempt (queue-time smtp send, admin "retry" action)
 * goes through deliverOutboxEmail and bumps the row's `attempts` counter.
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

/* ————————— SMTP delivery (lazily loaded; log driver never pays for it) ————————— */

let sharedTransporter: Transporter | null = null;
let transporterBroken = false;

async function smtpTransporter(): Promise<Transporter | null> {
  const url = env.smtpUrl;
  if (!url) return null; // configured smtp without SMTP_URL — record, never crash
  if (transporterBroken) return null;
  if (sharedTransporter) return sharedTransporter;
  const nodemailer = await import("nodemailer");
  sharedTransporter = nodemailer.createTransport(url);
  return sharedTransporter;
}

/** Queue one email: smtp driver attempts delivery first, log driver only persists. */
export async function queueOutboxEmail(input: OutboxEmailInput): Promise<void> {
  const email = await db.outboxEmail.create({
    data: {
      to: input.to,
      subject: input.subject,
      body: input.body,
      html: input.html,
      kind: input.kind,
      payload: input.payload as Prisma.InputJsonValue | undefined,
    },
  });
  if (env.mailDriver === "smtp") {
    // First delivery attempt at queue time — shared with the admin retry
    // path. A send failure keeps the row unsent (error recorded, attempts
    // counted) so a later retry can pick it up.
    await deliverOutboxEmail(email.id);
  }
}

/* ————————— delivery attempts (queue-time + admin retry) ————————— */

/** Fields one delivery attempt needs — queue input or a stored row. */
export interface DeliverableEmail {
  to: string;
  subject: string;
  body: string;
  html: string;
}

export interface DeliveryOutcome {
  sentAt: Date | null;
  providerMessageId: string | null;
  error: string | null;
}

/** One delivery attempt through the active driver — no DB writes. */
async function attemptDelivery(email: DeliverableEmail): Promise<DeliveryOutcome> {
  if (env.mailDriver !== "smtp") {
    // Log driver: the row itself is the delivery record, so an explicitly
    // requested attempt (the admin retry) marks the message delivered.
    // Queue-time never reaches this branch — queueOutboxEmail only calls
    // delivery under the smtp driver.
    return { sentAt: new Date(), providerMessageId: null, error: null };
  }
  const transporter = await smtpTransporter();
  if (!transporter) {
    return {
      sentAt: null,
      providerMessageId: null,
      error: env.smtpUrl ? "smtp transporter unavailable" : "MAIL_DRIVER=smtp but SMTP_URL is unset",
    };
  }
  try {
    const info = await transporter.sendMail({
      from: env.mailFrom,
      to: email.to,
      subject: email.subject,
      text: email.body,
      html: email.html,
    });
    return { sentAt: new Date(), providerMessageId: info.messageId ?? null, error: null };
  } catch (cause) {
    // Deliberately soft: the money path (donation callbacks) must never
    // fail because a mail server hiccuped — the row stays retryable.
    return {
      sentAt: null,
      providerMessageId: null,
      error: cause instanceof Error ? cause.message : String(cause),
    };
  }
}

export type DeliverOutboxResult =
  | { ok: false; reason: "not-found" | "already-sent" }
  | { ok: true; sent: boolean; attempts: number; error: string | null };

/**
 * Attempt immediate delivery of one stored outbox email (the admin retry
 * path). Every attempt increments `attempts`; success stamps sentAt and
 * clears the last error, failure records the message and keeps the row
 * retryable. Already-sent rows are refused — a retry must never
 * double-deliver.
 */
export async function deliverOutboxEmail(id: string): Promise<DeliverOutboxResult> {
  const email = await db.outboxEmail.findUnique({
    where: { id },
    select: { id: true, to: true, subject: true, body: true, html: true, sentAt: true },
  });
  if (!email) return { ok: false, reason: "not-found" };
  if (email.sentAt) return { ok: false, reason: "already-sent" };

  const outcome = await attemptDelivery(email);
  const row = await db.outboxEmail.update({
    where: { id },
    data: {
      attempts: { increment: 1 },
      sentAt: outcome.sentAt,
      providerMessageId: outcome.providerMessageId,
      error: outcome.error,
    },
    select: { attempts: true },
  });
  return { ok: true, sent: outcome.sentAt !== null, attempts: row.attempts, error: outcome.error };
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

export function escapeHtml(text: string): string {
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
