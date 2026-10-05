"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { LEDGER_DIRECTION_META } from "@/lib/finance-labels";
import type { LedgerDirection } from "@prisma/client";
import { cn } from "@/lib/utils";

const inputClass = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50";

export interface LedgerFundOption {
  id: string;
  nameBn: string;
}

export interface LedgerFormValues {
  id?: string;
  fundId: string;
  direction: LedgerDirection;
  amount: string;
  description: string;
  entryDate: string;
  attachment: PickedMedia | null;
}

/** "2026-01-15" (date input) → full ISO (zod datetime), today by default. */
function toIsoOrNow(value: string): string {
  return value ? new Date(`${value}T00:00:00Z`).toISOString() : new Date(new Date().toDateString()).toISOString();
}

function toInputDate(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

/** Create or edit a manual bookkeeping entry (attachment via the media picker). */
export function LedgerDialog({
  funds,
  initial,
  mode,
  trigger,
}: {
  funds: LedgerFundOption[];
  initial: LedgerFormValues;
  mode: "create" | "edit";
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<LedgerFormValues>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof LedgerFormValues>(key: K, value: LedgerFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave() {
    if (saving) return;
    const amount = Number(values.amount);
    if (!values.fundId) {
      toast({ title: "ফান্ড নির্বাচন করুন।", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(amount) || amount < 1) {
      toast({ title: "পরিমাণ সঠিক টাকায় দিন।", variant: "destructive" });
      return;
    }
    if (values.description.trim().length < 2) {
      toast({ title: "খাতের বিবরণ দিন।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        fundId: values.fundId,
        direction: values.direction,
        amount: Math.round(amount),
        description: values.description.trim(),
        entryDate: toIsoOrNow(values.entryDate),
        ...(mode === "edit" ? { attachmentMediaId: values.attachment?.id ?? null } : values.attachment?.id ? { attachmentMediaId: values.attachment.id } : {}),
      };
      const res = await fetch(mode === "create" ? "/api/admin/ledger" : `/api/admin/ledger/${values.id}`, {
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
      toast({ title: mode === "create" ? "লেজার এন্ট্রি যোগ হয়েছে" : "লেজার এন্ট্রি হালনাগাদ হয়েছে" });
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
          <DialogTitle>{mode === "create" ? "নতুন লেজার এন্ট্রি" : "লেজার এন্ট্রি সম্পাদনা"}</DialogTitle>
          <DialogDescription>
            অফিসের নিজস্ব আয়-ব্যয়ের বই — বিদ্যুৎ বিল, বই কেনা, যাকাত বিতরণ ইত্যাদি অনুদানের আয়ের পাশে চলে।
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold">খাত / বিবরণ *</label>
            <input
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={300}
              placeholder="বিদ্যুৎ বিল — অক্টোবর"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">ফান্ড *</label>
            <select value={values.fundId} onChange={(e) => set("fundId", e.target.value)} className={inputClass} aria-label="ফান্ড নির্বাচন">
              <option value="">— নির্বাচন করুন —</option>
              {funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.nameBn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">আয় / ব্যয় *</label>
            <div className="mt-1 grid grid-cols-2 gap-1.5 rounded-lg border p-1">
              {(Object.keys(LEDGER_DIRECTION_META) as LedgerDirection[]).map((direction) => (
                <button
                  key={direction}
                  type="button"
                  onClick={() => set("direction", direction)}
                  aria-pressed={values.direction === direction}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-[12.5px] font-bold transition-colors",
                    values.direction === direction
                      ? direction === "INCOME"
                        ? "bg-primary/10 text-primary"
                        : "bg-gold/15 text-gold-foreground dark:text-gold"
                      : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {LEDGER_DIRECTION_META[direction].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">পরিমাণ (৳) *</label>
            <input
              value={values.amount}
              onChange={(e) => set("amount", e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
              inputMode="numeric"
              placeholder="2500"
              dir="ltr"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">তারিখ *</label>
            <input type="date" value={values.entryDate} onChange={(e) => set("entryDate", e.target.value)} dir="ltr" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold">সংযুক্তি (ভাউচার/রিসিট)</label>
            <div className="mt-1">
              <MediaPicker
                label="সংযুক্তি নির্বাচন"
                kind="DOCUMENT"
                current={values.attachment}
                onSelect={(media) => set("attachment", media)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSave} disabled={saving} className="gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "এন্ট্রি যোগ করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Normalize a DB ledger row into the dialog's initial values. */
export function ledgerFormInitial(entry: {
  id: string;
  fundId: string;
  direction: LedgerDirection;
  amount: number;
  description: string;
  entryDate: Date | string;
  attachment: { id: string; filename: string; key: string; width: number | null; height: number | null; size: number } | null;
}): LedgerFormValues {
  return {
    id: entry.id,
    fundId: entry.fundId,
    direction: entry.direction,
    amount: String(entry.amount),
    description: entry.description,
    entryDate: toInputDate(new Date(entry.entryDate).toISOString()),
    attachment: entry.attachment
      ? {
          id: entry.attachment.id,
          filename: entry.attachment.filename,
          key: entry.attachment.key,
          width: entry.attachment.width,
          height: entry.attachment.height,
          size: entry.attachment.size,
        }
      : null,
  };
}
