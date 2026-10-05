"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MediaPicker, type PickedMedia } from "@/components/admin/ui/media-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface CampaignFundOption {
  id: string;
  key: string;
  nameBn: string;
}

export interface CampaignFormValues {
  id?: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  goalAmount: string;
  fundId: string;
  startsAt: string;
  endsAt: string;
  isPublished: boolean;
  sortOrder: string;
  coverMedia: PickedMedia | null;
}

const inputClass = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50";

/** "2026-01-15" (date input) → "2026-01-15T00:00:00.000Z" (zod datetime), "" → null. */
function toIsoOrNull(value: string): string | null {
  return value ? new Date(`${value}T00:00:00Z`).toISOString() : null;
}

/** ISO string → "yyyy-mm-dd" for date inputs. */
function toInputDate(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

/** Create or edit a fundraising campaign (cover image via the media picker). */
export function CampaignDialog({
  funds,
  initial,
  mode,
  trigger,
}: {
  funds: CampaignFundOption[];
  initial: CampaignFormValues;
  mode: "create" | "edit";
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CampaignFormValues>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof CampaignFormValues>(key: K, value: CampaignFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave() {
    if (saving) return;
    const goal = Number(values.goalAmount);
    if (!values.titleBn.trim()) {
      toast({ title: "শিরোনাম (বাংলা) দিন।", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(goal) || goal < 1000) {
      toast({ title: "লক্ষ্য পরিমাণ কমপক্ষে ১০০০ টাকা দিন।", variant: "destructive" });
      return;
    }
    if (!values.fundId) {
      toast({ title: "ফান্ড নির্বাচন করুন।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        titleBn: values.titleBn.trim(),
        titleEn: values.titleEn.trim(),
        descriptionBn: values.descriptionBn.trim(),
        descriptionEn: values.descriptionEn.trim(),
        goalAmount: Math.round(goal),
        fundId: values.fundId,
        startsAt: toIsoOrNull(values.startsAt),
        endsAt: toIsoOrNull(values.endsAt),
        isPublished: values.isPublished,
        sortOrder: Number.parseInt(values.sortOrder || "0", 10) || 0,
        ...(mode === "edit" ? { coverMediaId: values.coverMedia?.id ?? null } : {}),
      };
      const res = await fetch(mode === "create" ? "/api/admin/campaigns" : `/api/admin/campaigns/${values.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "",
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string> };
      if (!res.ok || !json.ok) {
        const firstField = json.fields ? Object.values(json.fields)[0] : null;
        toast({ title: firstField ?? json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: mode === "create" ? "ক্যাম্পেইন তৈরি হয়েছে" : "ক্যাম্পেইন হালনাগাদ হয়েছে" });
      setOpen(false);
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="scrollbar-thin max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "নতুন ক্যাম্পেইন" : "ক্যাম্পেইন সম্পাদনা"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "লক্ষ্য পরিমাণ ও ফান্ড ঠিক করুন — প্রকাশ করলে সাপোর্ট পেজে অগ্রগতি বারে দেখা যাবে।"
              : "শিরোনাম, বর্ণনা, লক্ষ্য বা প্রকাশনা অবস্থা বদলান।"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3.5">
          <div>
            <label className="text-sm font-semibold">শিরোনাম (বাংলা) *</label>
            <input
              value={values.titleBn}
              onChange={(e) => set("titleBn", e.target.value)}
              placeholder="লাইব্রেরির জন্য ১০০০ নতুন বই"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Title (English)</label>
            <input
              value={values.titleEn}
              onChange={(e) => set("titleEn", e.target.value)}
              placeholder="1,000 New Books for the Library"
              className={inputClass}
            />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">লক্ষ্য পরিমাণ (৳) *</label>
              <input
                value={values.goalAmount}
                onChange={(e) => set("goalAmount", e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
                inputMode="numeric"
                placeholder="250000"
                dir="ltr"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">ফান্ড *</label>
              <select
                value={values.fundId}
                onChange={(e) => set("fundId", e.target.value)}
                className={inputClass}
                aria-label="ফান্ড নির্বাচন"
              >
                <option value="">— নির্বাচন করুন —</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.nameBn} ({fund.key})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">বর্ণনা (বাংলা)</label>
            <textarea
              value={values.descriptionBn}
              onChange={(e) => set("descriptionBn", e.target.value)}
              rows={3}
              placeholder="ক্যাম্পেইনের উদ্দেশ্য সংক্ষেপে লিখুন…"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Description (English)</label>
            <textarea
              value={values.descriptionEn}
              onChange={(e) => set("descriptionEn", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">শুরু</label>
              <input type="date" value={values.startsAt} onChange={(e) => set("startsAt", e.target.value)} dir="ltr" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-semibold">শেষ</label>
              <input type="date" value={values.endsAt} onChange={(e) => set("endsAt", e.target.value)} dir="ltr" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">কভার ছবি</label>
            {mode === "create" ? (
              <p className="mt-1 rounded-lg bg-secondary/50 px-3 py-2 text-[12px] text-muted-foreground">
                তৈরি করার পর সম্পাদনা ডায়ালগ থেকে কভার ছবি যোগ করা যাবে।
              </p>
            ) : (
              <div className="mt-1">
                <MediaPicker
                  label="কভার ছবি নির্বাচন"
                  kind="IMAGE"
                  current={values.coverMedia}
                  onSelect={(media) => set("coverMedia", media)}
                />
              </div>
            )}
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">ক্রম (sortOrder)</label>
              <input
                value={values.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
                inputMode="numeric"
                placeholder="0"
                dir="ltr"
                className={inputClass}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
              <div>
                <p className="text-sm font-semibold">প্রকাশিত</p>
                <p className="text-[11px] text-muted-foreground">সাপোর্ট পেজে দেখাবে</p>
              </div>
              <Switch checked={values.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label="ক্যাম্পেইন প্রকাশিত" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSave} disabled={saving} className="gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "ক্যাম্পেইন তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Normalize a DB campaign row into the dialog's initial values. */
export function campaignFormInitial(campaign: {
  id: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  goalAmount: number;
  fundId: string;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  isPublished: boolean;
  sortOrder: number;
  coverMedia: { id: string; filename: string; key: string; width: number | null; height: number | null } | null;
}): CampaignFormValues {
  const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);
  return {
    id: campaign.id,
    titleBn: campaign.titleBn,
    titleEn: campaign.titleEn,
    descriptionBn: campaign.descriptionBn,
    descriptionEn: campaign.descriptionEn,
    goalAmount: String(campaign.goalAmount),
    fundId: campaign.fundId,
    startsAt: toInputDate(iso(campaign.startsAt)),
    endsAt: toInputDate(iso(campaign.endsAt)),
    isPublished: campaign.isPublished,
    sortOrder: String(campaign.sortOrder),
    coverMedia: campaign.coverMedia
      ? {
          id: campaign.coverMedia.id,
          filename: campaign.coverMedia.filename,
          key: campaign.coverMedia.key,
          width: campaign.coverMedia.width,
          height: campaign.coverMedia.height,
        }
      : null,
  };
}
