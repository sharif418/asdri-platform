import type { DonationStatus, LedgerDirection } from "@prisma/client";

/**
 * Bangla-first label maps + status-chip styling shared by the finance admin
 * pages (module home, donations ledger, manual ledger, outbox) — kept free of
 * React imports so server pages can use it directly (admission-labels pattern).
 */

export const DONATION_STATUS_META: Record<DonationStatus, { label: string; chip: string }> = {
  PENDING: { label: "অপেক্ষমাণ", chip: "bg-gold/15 text-gold" },
  COMPLETED: { label: "সম্পন্ন", chip: "bg-primary/10 text-primary" },
  FAILED: { label: "ব্যর্থ", chip: "bg-destructive/10 text-destructive" },
  REFUNDED: { label: "ফেরত", chip: "bg-muted text-muted-foreground" },
};

export function donationStatusChip(status: DonationStatus): string {
  return `rounded-full px-2 py-0.5 text-[10.5px] font-bold ${DONATION_STATUS_META[status]?.chip ?? "bg-muted text-muted-foreground"}`;
}

export function donationStatusLabel(status: DonationStatus): string {
  return DONATION_STATUS_META[status]?.label ?? status;
}

export const LEDGER_DIRECTION_META: Record<LedgerDirection, { label: string; chip: string }> = {
  INCOME: { label: "আয়", chip: "bg-primary/10 text-primary" },
  EXPENSE: { label: "ব্যয়", chip: "bg-gold/15 text-gold-foreground dark:text-gold" },
};

export function ledgerDirectionChip(direction: LedgerDirection): string {
  return `rounded-full px-2 py-0.5 text-[10.5px] font-bold ${LEDGER_DIRECTION_META[direction]?.chip ?? "bg-muted text-muted-foreground"}`;
}

export function ledgerDirectionLabel(direction: LedgerDirection): string {
  return LEDGER_DIRECTION_META[direction]?.label ?? direction;
}

/** Outbox kind → Bangla label for the email viewer (unknown kinds fall back). */
export const OUTBOX_KIND_LABELS: Record<string, string> = {
  "donation.receipt": "অনুদান রিসিপ্ট",
  "admission.exam_call": "ভর্তি পরীক্ষার চিঠি",
};

export function outboxKindLabel(kind: string): string {
  return OUTBOX_KIND_LABELS[kind] ?? kind;
}
