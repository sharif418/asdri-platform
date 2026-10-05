"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, BadgeX, Loader2, Mail, Undo2 } from "lucide-react";
import type { DonationStatus } from "@prisma/client";
import { toast } from "@/hooks/use-toast";
import { donationStatusChip, donationStatusLabel } from "@/lib/finance-labels";
import { formatDate, formatTaka } from "@/lib/format";

export interface DonationRowData {
  id: string;
  receiptNo: string | null;
  trackingCode: string;
  fundName: string;
  campaignTitle: string | null;
  amount: number;
  currency: string;
  donorName: string;
  isAnonymous: boolean;
  donorEmail: string | null;
  donorPhone: string | null;
  status: DonationStatus;
  createdAt: string;
  paidAt: string | null;
  receiptSentAt: string | null;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/**
 * The finance officer's donations ledger — server-rendered rows, this island
 * owns the per-donation actions (manual completion, failure, refund,
 * receipt re-send). Status transitions are enforced API-side; buttons that
 * cannot apply in the current status simply don't render.
 */
export function DonationsTable({ donations }: { donations: DonationRowData[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patch(donation: DonationRowData, body: Record<string, unknown>, confirmText: string | null, successTitle: string) {
    if (busyId) return;
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(donation.id);
    try {
      const res = await fetch(`/api/admin/donations/${donation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "কাজটি সম্পন্ন হয়নি", variant: "destructive" });
        return;
      }
      toast({ title: successTitle });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">রিসিপ্ট / ট্র্যাকিং</th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">ফান্ড</th>
            <th className="px-4 py-3 font-semibold">পরিমাণ</th>
            <th className="hidden px-4 py-3 font-semibold lg:table-cell">দাতা</th>
            <th className="hidden px-4 py-3 font-semibold lg:table-cell">তারিখ</th>
            <th className="px-4 py-3 font-semibold">স্ট্যাটাস</th>
            <th className="px-4 py-3 text-right font-semibold">অফিসার অ্যাকশন</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {donations.map((donation) => {
            const busy = busyId === donation.id;
            return (
              <tr key={donation.id} className="transition-colors hover:bg-secondary/20">
                <td className="px-4 py-3" dir="ltr">
                  <p className="font-mono text-[12.5px] font-bold">{donation.receiptNo ?? "—"}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{donation.trackingCode}</p>
                </td>
                <td className="hidden max-w-40 px-4 py-3 md:table-cell">
                  <p className="truncate text-[12.5px] font-medium">{donation.fundName}</p>
                  {donation.campaignTitle && (
                    <p className="truncate text-[11px] text-gold-foreground dark:text-gold">{donation.campaignTitle}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="text-[13px] font-bold text-primary">{formatTaka(donation.amount, "bn")}</p>
                  {donation.currency !== "BDT" && (
                    <p className="text-[10.5px] text-muted-foreground">{donation.currency}</p>
                  )}
                </td>
                <td className="hidden max-w-44 px-4 py-3 lg:table-cell">
                  <p className="truncate text-[12.5px] font-medium">
                    {donation.donorName}
                    {donation.isAnonymous && (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[9.5px] font-bold text-muted-foreground" title="দাতা গোপন রাখতে চেয়েছেন — প্রকাশ্যে Anonymous">
                        গোপন
                      </span>
                    )}
                  </p>
                  {donation.donorEmail && <p className="truncate text-[11px] text-muted-foreground" dir="ltr">{donation.donorEmail}</p>}
                </td>
                <td className="hidden px-4 py-3 text-[12px] text-muted-foreground lg:table-cell">
                  <p>{formatDate(donation.createdAt, "bn")}</p>
                  {donation.paidAt && <p className="text-[11px] text-primary">পরিশোধ: {formatDate(donation.paidAt, "bn")}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={donationStatusChip(donation.status)}>{donationStatusLabel(donation.status)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {busy ? (
                      <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        {(donation.status === "PENDING" || donation.status === "FAILED") && (
                          <button
                            type="button"
                            onClick={() =>
                              patch(
                                donation,
                                { status: "COMPLETED", note: "ম্যানুয়াল পেমেন্ট গৃহীত (bKash/নগদ/ব্যাংক)" },
                                `${donation.receiptNo ?? donation.trackingCode} — পেমেন্ট সম্পন্ন হিসেবে নিশ্চিত করা হবে এবং রিসিপ্ট ইমেইল হবে। নিশ্চিত?`,
                                "অনুদান সম্পন্ন হিসেবে নিশ্চিত হয়েছে",
                              )
                            }
                            title="ম্যানুয়াল পেমেন্ট পাওয়া গেছে — সম্পন্ন করুন"
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/20"
                          >
                            <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
                            সম্পন্ন
                          </button>
                        )}
                        {donation.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => patch(donation, { status: "FAILED", note: "পেমেন্ট আসেনি" }, `${donation.trackingCode} ব্যর্থ হিসেবে চিহ্নিত হবে। নিশ্চিত?`, "অনুদান ব্যর্থ হিসেবে চিহ্নিত হয়েছে")}
                            title="পেমেন্ট আসেনি — ব্যর্থ হিসেবে চিহ্নিত করুন"
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <BadgeX aria-hidden className="h-3.5 w-3.5" />
                            ব্যর্থ
                          </button>
                        )}
                        {donation.status === "COMPLETED" && (
                          <>
                            {donation.donorEmail && (
                              <button
                                type="button"
                                onClick={() => patch(donation, { action: "resend_receipt" }, null, "রিসিপ্ট আবার পাঠানো হয়েছে (আউটবক্সে যোগ হলো)")}
                                title="রিসিপ্ট ইমেইল আবার পাঠান"
                                aria-label={`${donation.receiptNo ?? donation.trackingCode} রিসিপ্ট আবার পাঠান`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                <Mail aria-hidden className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => patch(donation, { status: "REFUNDED", note: "দাতাকে ফেরত দেওয়া হয়েছে" }, `${donation.trackingCode} — পরিমাণ ${formatTaka(donation.amount, "bn")} ফেরত দেওয়া হয়েছে হিসেবে চিহ্নিত হবে। নিশ্চিত?`, "অনুদান ফেরত হিসেবে চিহ্নিত হয়েছে")}
                              title="ফেরত দেওয়া হয়েছে হিসেবে চিহ্নিত করুন"
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                            >
                              <Undo2 aria-hidden className="h-3.5 w-3.5" />
                              ফেরত
                            </button>
                          </>
                        )}
                        {donation.status === "REFUNDED" && (
                          <span className="text-[11.5px] text-muted-foreground">—</span>
                        )}
                        {donation.status === "FAILED" && !donation.donorEmail && <span className="text-[11.5px] text-muted-foreground">—</span>}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
