"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpenCheck, Loader2, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GeneralError, fieldId, useFieldErrors } from "@/components/admin/ui/form-errors";
import { cn } from "@/lib/utils";
import { formatDateTimeBn, toBnDigits } from "@/lib/format";

/** One row of the circulation table — the shape GET checkouts returns. */
interface CheckoutRow {
  id: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerUserId: string | null;
  borrowedAt: string;
  dueAt: string | null;
  returnedAt: string | null;
  note: string;
  item: { id: string; slug: string; titleBn: string; titleEn: string; type: string };
}

export interface CheckoutItemOption {
  id: string;
  titleBn: string;
  type: string;
}

type StatusFilter = "open" | "returned" | "all";

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

const TABS: { value: StatusFilter; label: string }[] = [
  { value: "open", label: "বর্তমানে ধারে" },
  { value: "returned", label: "ফেরত হয়েছে" },
  { value: "all", label: "সব" },
];

const inputClass = "w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50";

/** Circulation desk — open/returned tabs, ধার নিন dialog, ফেরত দিন action. */
export function LibraryCheckoutsManager({ items }: { items: CheckoutItemOption[] }) {
  const [rows, setRows] = useState<CheckoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("open");
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presetItemId, setPresetItemId] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fe = useFieldErrors();

  // ধার নিন form state
  const [itemId, setItemId] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/library/checkouts?${params.toString()}`);
      const json = (await res.json()) as { ok: boolean; data?: { items: CheckoutRow[] } };
      if (json.ok && json.data) {
        setRows(json.data.items);
      } else {
        toast({ title: "তালিকা আনা যায়নি", variant: "destructive" });
      }
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), q ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, q]);

  function openDialog(presetItem = "") {
    fe.clear();
    setPresetItemId(presetItem);
    setItemId(presetItem);
    setBorrowerName("");
    setBorrowerPhone("");
    setDueAt("");
    setNote("");
    setDialogOpen(true);
  }

  async function createCheckout() {
    if (saving) return;
    setSaving(true);
    fe.clear();
    try {
      const res = await fetch("/api/admin/library/checkouts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({
          itemId,
          borrowerName,
          borrowerPhone,
          dueAt: dueAt || null,
          note,
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string> };
      if (!res.ok || !json.ok) {
        const summary = fe.setFromResponse(json) ?? "ধার রেকর্ড করা যায়নি";
        toast({ title: summary, variant: "destructive" });
        return;
      }
      toast({ title: "ধার রেকর্ড হয়েছে" });
      setDialogOpen(false);
      if (status !== "open") setStatus("open");
      else void load();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function markReturned(row: CheckoutRow) {
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/library/checkouts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ returned: true }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (res.ok && json.ok) {
        toast({ title: "ফেরত গ্রহণ করা হয়েছে" });
        void load();
      } else {
        toast({ title: json.error ?? "ফেরত নেওয়া যায়নি", variant: "destructive" });
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="ধারের অবস্থা" className="flex flex-wrap gap-1 rounded-xl border bg-secondary/40 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => setStatus(tab.value)}
              className={
                status === tab.value
                  ? "rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground"
                  : "rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => openDialog()}>
          <Plus aria-hidden className="h-4 w-4" />
          ধার নিন
        </Button>
      </div>

      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="পাঠকের নাম, ফোন বা আইটেমের শিরোনাম দিয়ে খুঁজুন…"
          aria-label="ধার রেকর্ড অনুসন্ধান"
          className="w-full rounded-lg border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
        />
      </form>

      <p className="text-[12px] text-muted-foreground">{loading ? "লোড হচ্ছে…" : `${toBnDigits(rows.length)}টি রেকর্ড`}</p>

      <div className="max-h-[62vh] overflow-x-auto overflow-y-auto rounded-2xl border bg-card shadow-sm">
        {rows.length === 0 && !loading ? (
          <div className="px-6 py-16 text-center">
            <BookOpenCheck aria-hidden className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="font-heading mt-2 text-lg font-bold">কোনো রেকর্ড নেই</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {status === "open" ? "এই মুহূর্তে কারও কাছে বই ধার নেই।" : status === "returned" ? "এখনো কিছু ফেরত আসেনি।" : "প্রথম ধারের রেকর্ডটি তৈরি করুন।"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">আইটেম</th>
                <th className="px-4 py-3 font-semibold">ধারগ্রহীতা</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">ধার নেওয়ার তারিখ</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">ফেরতের শেষ সময়</th>
                <th className="hidden px-4 py-3 font-semibold xl:table-cell">অবস্থা</th>
                <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const overdue = row.returnedAt == null && row.dueAt != null && new Date(row.dueAt) < new Date();
                return (
                  <tr key={row.id} className="transition-colors hover:bg-secondary/20">
                    <td className="max-w-xs px-4 py-3">
                      <span className="block truncate font-medium" dir="auto">
                        {row.item.titleBn}
                      </span>
                      {row.note ? <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{row.note}</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium">{row.borrowerName}</span>
                      {row.borrowerPhone ? (
                        <span className="block text-[11.5px] text-muted-foreground" dir="ltr">
                          {row.borrowerPhone}
                        </span>
                      ) : null}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-[12.5px] text-muted-foreground md:table-cell">{formatDateTimeBn(row.borrowedAt)}</td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-[12.5px] lg:table-cell">{row.dueAt ? formatDateTimeBn(row.dueAt) : "—"}</td>
                    <td className="hidden px-4 py-3 xl:table-cell">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          row.returnedAt != null ? "bg-secondary text-muted-foreground" : overdue ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
                        )}
                      >
                        {row.returnedAt != null ? `ফেরত (${formatDateTimeBn(row.returnedAt)})` : overdue ? "মেয়াদোত্তীর্ণ" : "ধারে আছে"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {row.returnedAt == null ? (
                        <Button type="button" variant="outline" size="sm" disabled={busyId === row.id} onClick={() => void markReturned(row)}>
                          {busyId === row.id ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : null}
                          ফেরত দিন
                        </Button>
                      ) : (
                        <span className="text-[11.5px] text-muted-foreground">সম্পন্ন</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">নতুন ধার রেকর্ড</DialogTitle>
            <DialogDescription>তাক থেকে বই বের হলে এখানে লিখে রাখুন — ফেরত এসে ট্যাব থেকেই সম্পন্ন করুন।</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <GeneralError message={fe.general} />
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">আইটেম</span>
              <select
                id={fieldId("itemId")}
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className={inputClass}
                aria-invalid={fe.errors.itemId ? true : undefined}
              >
                <option value="">— আইটেম বেছে নিন —</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.titleBn}
                  </option>
                ))}
              </select>
              <fe.ErrorText name="itemId" />
            </label>
            {presetItemId ? <p className="text-[11.5px] text-muted-foreground">আইটেম তালিকা থেকে প্রি-নির্বাচিত।</p> : null}
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">ধারগ্রহীতার নাম</span>
              <Input
                id={fieldId("borrowerName")}
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="মুহাম্মদ আব্দুল্লাহ"
                className={inputClass}
                aria-invalid={fe.errors.borrowerName ? true : undefined}
              />
              <fe.ErrorText name="borrowerName" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">ফোন (ঐচ্ছিক)</span>
                <Input dir="ltr" value={borrowerPhone} onChange={(e) => setBorrowerPhone(e.target.value)} placeholder="01XXXXXXXXX" className={inputClass} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">ফেরতের শেষ তারিখ</span>
                <Input id={fieldId("dueAt")} dir="ltr" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={inputClass} />
                <fe.ErrorText name="dueAt" />
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">মন্তব্য (ঐচ্ছিক)</span>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="কার্ড নম্বর, শর্ত…" className={inputClass} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={createCheckout} disabled={saving || !itemId || borrowerName.trim().length < 2} className="gap-1.5 font-semibold">
              {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <BookOpenCheck aria-hidden className="h-4 w-4" />}
              ধার রেকর্ড করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
