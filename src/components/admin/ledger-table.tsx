"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LedgerDialog, ledgerFormInitial, type LedgerFundOption } from "@/components/admin/ledger-dialog";
import { ledgerDirectionChip, ledgerDirectionLabel } from "@/lib/finance-labels";
import { formatDate, formatTaka } from "@/lib/format";

export interface LedgerRowData {
  id: string;
  fundId: string;
  fundNameBn: string;
  direction: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  entryDate: string;
  attachment: { id: string; filename: string; key: string; width: number | null; height: number | null; size: number } | null;
  createdByName: string | null;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Manual ledger table — create/edit dialog, delete, attachment links. */
export function LedgerTable({ entries, funds }: { entries: LedgerRowData[]; funds: LedgerFundOption[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onDelete(entry: LedgerRowData) {
    if (busyId) return;
    if (!window.confirm(`"${entry.description}" এন্ট্রিটি মুছে ফেলা হবে। নিশ্চিত?`)) return;
    setBusyId(entry.id);
    try {
      const res = await fetch(`/api/admin/ledger/${entry.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken() },
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "এন্ট্রি মুছে ফেলা হয়েছে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
        <p className="font-heading text-lg font-bold">এখনো কোনো ম্যানুয়াল এন্ট্রি নেই</p>
        <p className="mt-1 text-sm text-muted-foreground">
          বিদ্যুৎ বিল, বই কেনা বা যাকাত বিতরণের মতো খাতগুলো এখানে লিখে রাখুন — ফান্ডভিত্তিক ব্যালেন্স নিজেই হিসাব হবে।
        </p>
        <div className="mt-4 flex justify-center">
          <LedgerDialog
            mode="create"
            funds={funds}
            initial={{
              fundId: funds[0]?.id ?? "",
              direction: "EXPENSE",
              amount: "",
              description: "",
              entryDate: new Date().toISOString().slice(0, 10),
              attachment: null,
            }}
            trigger={
              <Button className="gap-2 font-semibold">
                <Plus aria-hidden className="h-4 w-4" />
                নতুন এন্ট্রি
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">তারিখ</th>
            <th className="px-4 py-3 font-semibold">খাত / বিবরণ</th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">ফান্ড</th>
            <th className="px-4 py-3 font-semibold">ধরন</th>
            <th className="px-4 py-3 text-right font-semibold">পরিমাণ</th>
            <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map((entry) => {
            const busy = busyId === entry.id;
            return (
              <tr key={entry.id} className="transition-colors hover:bg-secondary/20">
                <td className="hidden px-4 py-3 text-[12px] text-muted-foreground sm:table-cell">
                  {formatDate(entry.entryDate, "bn")}
                </td>
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate text-[13px] font-medium">{entry.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="sm:hidden">{formatDate(entry.entryDate, "bn")} · </span>
                    {entry.createdByName ?? "—"}
                    {entry.attachment && entry.attachment.key && (
                      <>
                        {" · "}
                        <a href={`/api/media/${entry.attachment.key}`} className="font-semibold text-primary hover:underline" target="_blank" rel="noreferrer">
                          সংযুক্তি
                        </a>
                      </>
                    )}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-[12.5px] md:table-cell">{entry.fundNameBn}</td>
                <td className="px-4 py-3">
                  <span className={ledgerDirectionChip(entry.direction)}>{ledgerDirectionLabel(entry.direction)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-[13px] font-bold ${entry.direction === "INCOME" ? "text-primary" : "text-gold-foreground dark:text-gold"}`}>
                    {entry.direction === "INCOME" ? "+" : "−"}
                    {formatTaka(entry.amount, "bn")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {busy ? (
                      <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <LedgerDialog
                          mode="edit"
                          funds={funds}
                          initial={ledgerFormInitial({
                            id: entry.id,
                            fundId: entry.fundId,
                            direction: entry.direction,
                            amount: entry.amount,
                            description: entry.description,
                            entryDate: entry.entryDate,
                            attachment: entry.attachment,
                          })}
                          trigger={
                            <button
                              type="button"
                              aria-label={`${entry.description} সম্পাদনা`}
                              title="সম্পাদনা"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Pencil aria-hidden className="h-4 w-4" />
                            </button>
                          }
                        />
                        <button
                          type="button"
                          onClick={() => onDelete(entry)}
                          aria-label={`${entry.description} মুছে ফেলুন`}
                          title="মুছে ফেলুন"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 aria-hidden className="h-4 w-4" />
                        </button>
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
