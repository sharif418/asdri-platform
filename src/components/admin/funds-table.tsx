"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FundDialog } from "@/components/admin/fund-dialog";
import { formatTaka, toBnDigits } from "@/lib/format";

export interface FundRowData {
  id: string;
  key: string;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  descriptionEn: string;
  isDefault: boolean;
  isEnabled: boolean;
  sortOrder: number;
  donationCount: number;
  entryCount: number;
  completedTotal: number;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Funds manager table — enable/disable, edit dialog, guarded delete. */
export function FundsTable({ funds }: { funds: FundRowData[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patchEnabled(fund: FundRowData, isEnabled: boolean) {
    if (busyId) return;
    setBusyId(fund.id);
    try {
      const res = await fetch(`/api/admin/funds/${fund.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ isEnabled }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "বদলানো যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: isEnabled ? "ফান্ড সক্রিয় হয়েছে — সাপোর্ট পেজে দেখা যাবে" : "ফান্ড নিষ্ক্রিয় করা হয়েছে — সাপোর্ট পেজ থেকে উঠে যাবে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(fund: FundRowData) {
    if (busyId) return;
    if (fund.donationCount > 0 || fund.entryCount > 0) return; // soft guard; API 409s too
    if (!window.confirm(`"${fund.nameBn}" ফান্ডটি মুছে ফেলা হবে। নিশ্চিত?`)) return;
    setBusyId(fund.id);
    try {
      const res = await fetch(`/api/admin/funds/${fund.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken() },
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "ফান্ড মুছে ফেলা হয়েছে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  if (funds.length === 0) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
        <p className="font-heading text-lg font-bold">কোনো ফান্ড নেই</p>
        <p className="mt-1 text-sm text-muted-foreground">অন্তত একটি সক্রিয় ফান্ড থাকলে অনুদান ফর্ম কাজ করে।</p>
        <div className="mt-4 flex justify-center">
          <FundDialog
            mode="create"
            initial={{ key: "", nameBn: "", nameEn: "", descriptionBn: "", descriptionEn: "", isDefault: false, isEnabled: true, sortOrder: "0" }}
            trigger={
              <Button className="gap-2 font-semibold">
                <Plus aria-hidden className="h-4 w-4" />
                নতুন ফান্ড
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
            <th className="px-4 py-3 font-semibold">ফান্ড</th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">সংগ্রহ</th>
            <th className="hidden px-4 py-3 font-semibold lg:table-cell">রেফারেন্স</th>
            <th className="px-4 py-3 font-semibold">অবস্থা</th>
            <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {funds.map((fund) => {
            const hasReferences = fund.donationCount > 0 || fund.entryCount > 0;
            const busy = busyId === fund.id;
            return (
              <tr key={fund.id} className="transition-colors hover:bg-secondary/20">
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate text-[13.5px] font-medium">
                    {fund.nameBn}
                    {fund.isDefault && (
                      <span className="ml-1.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9.5px] font-bold text-gold">ডিফল্ট</span>
                    )}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground" dir="ltr">
                    {fund.key}
                  </p>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <p className="text-[12.5px] font-bold text-primary">{formatTaka(fund.completedTotal, "bn")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {toBnDigits(fund.donationCount)} অনুদান · {toBnDigits(fund.entryCount)} এন্ট্রি
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-[12px] text-muted-foreground lg:table-cell" dir="ltr">
                  {fund.nameEn || "—"}
                </td>
                <td className="px-4 py-3">
                  {fund.isEnabled ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary">সক্রিয়</span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-bold text-muted-foreground">নিষ্ক্রিয়</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {busy ? (
                      <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => patchEnabled(fund, !fund.isEnabled)}
                          title={fund.isEnabled ? "নিষ্ক্রিয় করুন — সাপোর্ট পেজ থেকে সরে যাবে" : "সক্রিয় করুন — সাপোর্ট পেজে ফিরে আসবে"}
                          className={`inline-flex h-9 items-center rounded-lg px-2.5 text-[12px] font-semibold transition-colors ${
                            fund.isEnabled
                              ? "border text-muted-foreground hover:bg-secondary"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          }`}
                        >
                          {fund.isEnabled ? "নিষ্ক্রিয়" : "সক্রিয়"}
                        </button>
                        <FundDialog
                          mode="edit"
                          initial={{
                            id: fund.id,
                            key: fund.key,
                            nameBn: fund.nameBn,
                            nameEn: fund.nameEn,
                            descriptionBn: fund.descriptionBn,
                            descriptionEn: fund.descriptionEn,
                            isDefault: fund.isDefault,
                            isEnabled: fund.isEnabled,
                            sortOrder: String(fund.sortOrder),
                          }}
                          trigger={
                            <button
                              type="button"
                              aria-label={`${fund.nameBn} সম্পাদনা`}
                              title="সম্পাদনা"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Pencil aria-hidden className="h-4 w-4" />
                            </button>
                          }
                        />
                        <button
                          type="button"
                          onClick={() => onDelete(fund)}
                          disabled={hasReferences}
                          aria-label={`${fund.nameBn} মুছে ফেলুন`}
                          title={hasReferences ? "অনুদান/এন্ট্রি আছে — মুছা যাবে না, নিষ্ক্রিয় করুন" : "মুছে ফেলুন"}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
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
