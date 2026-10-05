"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const inputClass = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50";

export interface FundFormValues {
  id?: string;
  key: string;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  descriptionEn: string;
  isDefault: boolean;
  isEnabled: boolean;
  sortOrder: string;
}

/** Create or edit a fund — the key is immutable after creation (API contract). */
export function FundDialog({
  initial,
  mode,
  trigger,
}: {
  initial: FundFormValues;
  mode: "create" | "edit";
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FundFormValues>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FundFormValues>(key: K, value: FundFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave() {
    if (saving) return;
    if (!values.nameBn.trim()) {
      toast({ title: "নাম (বাংলা) দিন।", variant: "destructive" });
      return;
    }
    if (mode === "create" && !/^[a-z][a-z0-9-]{1,30}$/.test(values.key.trim())) {
      toast({ title: "কী ছোট হাতের ইংরেজি অক্ষর/সংখ্যা/হাইফেন দিয়ে দিন।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body =
        mode === "create"
          ? {
              key: values.key.trim(),
              nameBn: values.nameBn.trim(),
              nameEn: values.nameEn.trim(),
              descriptionBn: values.descriptionBn.trim(),
              descriptionEn: values.descriptionEn.trim(),
              isDefault: values.isDefault,
              isEnabled: values.isEnabled,
              sortOrder: Number.parseInt(values.sortOrder || "0", 10) || 0,
            }
          : {
              nameBn: values.nameBn.trim(),
              nameEn: values.nameEn.trim(),
              descriptionBn: values.descriptionBn.trim(),
              descriptionEn: values.descriptionEn.trim(),
              isDefault: values.isDefault,
              isEnabled: values.isEnabled,
              sortOrder: Number.parseInt(values.sortOrder || "0", 10) || 0,
            };
      const res = await fetch(mode === "create" ? "/api/admin/funds" : `/api/admin/funds/${values.id}`, {
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
      toast({ title: mode === "create" ? "ফান্ড তৈরি হয়েছে" : "ফান্ড হালনাগাদ হয়েছে" });
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
      <DialogContent className="scrollbar-thin max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "নতুন ফান্ড" : "ফান্ড সম্পাদনা"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "কী একবার ঠিক হলে আর বদলানো যায় না — যত্ন নিয়ে দিন।"
              : "নাম, বর্ণনা ও অবস্থা বদলানো যায় — কী অপরিবর্তনীয়।"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3.5">
          <div>
            <label className="text-sm font-semibold">কী (key)</label>
            {mode === "create" ? (
              <input
                value={values.key}
                onChange={(e) => set("key", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 31))}
                placeholder="emergency-relief"
                dir="ltr"
                className={inputClass}
              />
            ) : (
              <input value={values.key} readOnly disabled dir="ltr" className={`${inputClass} bg-secondary/50 font-mono text-muted-foreground`} />
            )}
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">নাম (বাংলা) *</label>
              <input value={values.nameBn} onChange={(e) => set("nameBn", e.target.value)} dir="rtl" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-semibold">Name (English)</label>
              <input value={values.nameEn} onChange={(e) => set("nameEn", e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">বর্ণনা (বাংলা)</label>
            <textarea value={values.descriptionBn} onChange={(e) => set("descriptionBn", e.target.value)} rows={2} dir="rtl" className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-semibold">Description (English)</label>
            <textarea value={values.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} rows={2} className={inputClass} />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
              <div>
                <p className="text-sm font-semibold">সক্রিয়</p>
                <p className="text-[11px] text-muted-foreground">বন্ধ করলে সাপোর্ট পেজ থেকে উঠে যাবে</p>
              </div>
              <Switch checked={values.isEnabled} onCheckedChange={(v) => set("isEnabled", v)} aria-label="ফান্ড সক্রিয়" />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
              <div>
                <p className="text-sm font-semibold">ডিফল্ট</p>
                <p className="text-[11px] text-muted-foreground">ফর্মে প্রাথমিক নির্বাচন</p>
              </div>
              <Switch checked={values.isDefault} onCheckedChange={(v) => set("isDefault", v)} aria-label="ফান্ড ডিফল্ট" />
            </div>
          </div>
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
        </div>

        <DialogFooter>
          <Button onClick={onSave} disabled={saving} className="gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "ফান্ড তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
