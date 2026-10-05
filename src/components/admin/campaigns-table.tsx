"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CampaignDialog, campaignFormInitial, type CampaignFundOption } from "@/components/admin/campaign-dialog";
import { formatDate, formatTaka, toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CampaignRowData {
  id: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  fundId: string;
  fundNameBn: string;
  goalAmount: number;
  raised: number;
  donorCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isPublished: boolean;
  sortOrder: number;
  coverMedia: { id: string; filename: string; key: string; width: number | null; height: number | null } | null;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Campaigns manager table — live progress, publish state, edit + guarded delete. */
export function CampaignsTable({ campaigns, funds }: { campaigns: CampaignRowData[]; funds: CampaignFundOption[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onDelete(campaign: CampaignRowData) {
    if (busyId) return;
    if (campaign.donorCount > 0) return; // soft guard — the API 409s too
    if (!window.confirm(`"${campaign.titleBn}" ক্যাম্পেইনটি মুছে ফেলা হবে। নিশ্চিত?`)) return;
    setBusyId(campaign.id);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken() },
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "ক্যাম্পেইন মুছে ফেলা হয়েছে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
        <p className="font-heading text-lg font-bold">এখনো কোনো ক্যাম্পেইন নেই</p>
        <p className="mt-1 text-sm text-muted-foreground">
          প্রথম ক্যাম্পেইন তৈরি করুন — লক্ষ্যমাত্রা ঠিক করে প্রকাশ করলে সাপোর্ট পেজে অগ্রগতি দেখা যাবে।
        </p>
        <div className="mt-4 flex justify-center">
          <CampaignDialog
            mode="create"
            funds={funds}
            initial={{
              titleBn: "",
              titleEn: "",
              descriptionBn: "",
              descriptionEn: "",
              goalAmount: "",
              fundId: funds[0]?.id ?? "",
              startsAt: "",
              endsAt: "",
              isPublished: true,
              sortOrder: "0",
              coverMedia: null,
            }}
            trigger={
              <Button className="gap-2 font-semibold">
                <Plus aria-hidden className="h-4 w-4" />
                নতুন ক্যাম্পেইন
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-clip rounded-2xl border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">ক্যাম্পেইন</th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">ফান্ড</th>
            <th className="px-4 py-3 font-semibold">অগ্রগতি</th>
            <th className="hidden px-4 py-3 font-semibold lg:table-cell">সময়কাল</th>
            <th className="px-4 py-3 font-semibold">প্রকাশ</th>
            <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {campaigns.map((campaign) => {
            const pct = campaign.goalAmount > 0 ? Math.min(100, Math.round((campaign.raised / campaign.goalAmount) * 100)) : 0;
            const hasDonations = campaign.donorCount > 0;
            const busy = busyId === campaign.id;
            return (
              <tr key={campaign.id} className="transition-colors hover:bg-secondary/20">
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate text-[13.5px] font-medium">{campaign.titleBn}</p>
                  <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
                    {campaign.titleEn || campaign.id.slice(-8)}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-[12.5px] md:table-cell">{campaign.fundNameBn}</td>
                <td className="px-4 py-3">
                  <div className="min-w-36">
                    <p className="text-[12.5px] font-semibold">
                      <span className="text-primary">{formatTaka(campaign.raised, "bn")}</span>
                      <span className="text-muted-foreground"> / {formatTaka(campaign.goalAmount, "bn")}</span>
                    </p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${campaign.titleBn} অগ্রগতি`}>
                      <div className={cn("h-full rounded-full", pct >= 100 ? "bg-primary" : "bg-gold")} style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {toBnDigits(pct)}% · {toBnDigits(campaign.donorCount)} টি অনুদান
                    </p>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-[12px] text-muted-foreground lg:table-cell">
                  {campaign.startsAt || campaign.endsAt ? (
                    <p>
                      {campaign.startsAt ? formatDate(campaign.startsAt, "bn") : "—"}
                      <span aria-hidden> → </span>
                      {campaign.endsAt ? formatDate(campaign.endsAt, "bn") : "খোলা"}
                    </p>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {campaign.isPublished ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary">প্রকাশিত</span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-bold text-muted-foreground">ড্রাফট</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {busy ? (
                      <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <CampaignDialog
                          mode="edit"
                          funds={funds}
                          initial={campaignFormInitial(campaign)}
                          trigger={
                            <button
                              type="button"
                              aria-label={`${campaign.titleBn} সম্পাদনা`}
                              title="সম্পাদনা"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Pencil aria-hidden className="h-4 w-4" />
                            </button>
                          }
                        />
                        <button
                          type="button"
                          onClick={() => onDelete(campaign)}
                          disabled={hasDonations}
                          aria-label={`${campaign.titleBn} মুছে ফেলুন`}
                          title={hasDonations ? "অনুদানের ইতিহাস আছে — মুছা যাবে না, প্রকাশ বন্ধ করুন" : "মুছে ফেলুন"}
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
