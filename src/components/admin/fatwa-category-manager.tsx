"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Loader2, Tags } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/format";

export interface CategoryRow {
  id: string;
  key: string;
  nameBn: string;
  nameEn: string;
  sortOrder: number;
  entryCount: number;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Fatwa bank categories — inline rename + up/down reorder. */
export function FatwaCategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(categories);
  const [drafts, setDrafts] = useState<Record<string, { nameBn: string; nameEn: string }>>(
    Object.fromEntries(categories.map((c) => [c.id, { nameBn: c.nameBn, nameEn: c.nameEn }])),
  );
  const [busy, setBusy] = useState<string | null>(null);

  function setDraft(id: string, field: "nameBn" | "nameEn", value: string) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function dirty(row: CategoryRow): boolean {
    const draft = drafts[row.id];
    return draft !== undefined && (draft.nameBn !== row.nameBn || draft.nameEn !== row.nameEn);
  }

  async function rename(row: CategoryRow) {
    if (busy) return;
    const draft = drafts[row.id];
    if (!draft || !dirty(row)) return;
    setBusy(row.id);
    try {
      const res = await fetch("/api/admin/fatwa-categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ id: row.id, nameBn: draft.nameBn.trim(), nameEn: draft.nameEn.trim() }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string> };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? Object.values(json.fields ?? {})[0] ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, nameBn: draft.nameBn.trim(), nameEn: draft.nameEn.trim() } : r)));
      toast({ title: "ক্যাটাগরির নাম সংরক্ষিত" });
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (busy) return;
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    setBusy(`move-${next[index].id}`);
    try {
      const res = await fetch("/api/admin/fatwa-categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ order: next.map((row, position) => ({ id: row.id, sortOrder: position })) }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "ক্রম বদলানো যায়নি", variant: "destructive" });
        setRows(categories);
        return;
      }
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
      setRows(categories);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-label="ফতোয়া ক্যাটাগরি ব্যবস্থাপনা">
      <h2 className="font-heading flex items-center gap-2 text-base font-bold">
        <Tags aria-hidden className="h-5 w-5 text-primary" />
        ক্যাটাগরি ব্যবস্থাপনা
      </h2>
      <p className="mt-1 text-[11.5px] text-muted-foreground">নাম বদলানোর পর সংরক্ষণ করুন; তীর চিহ্নে ক্রম বদলান।</p>
      <ul className="mt-3 space-y-2">
        {rows.map((row, index) => {
          const draft = drafts[row.id] ?? { nameBn: row.nameBn, nameEn: row.nameEn };
          return (
            <li key={row.id} className="rounded-lg border bg-background p-2.5">
              <div className="flex items-center gap-2">
                <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground" dir="ltr">
                  {row.key}
                </code>
                <span className="text-[10.5px] text-muted-foreground">{formatNumber(row.entryCount, "bn")}টি ফতোয়া</span>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => void move(index, -1)}
                  disabled={index === 0 || busy !== null}
                  aria-label={`${row.nameBn} উপরে নিন`}
                  className="rounded-md border p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronUp aria-hidden className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void move(index, 1)}
                  disabled={index === rows.length - 1 || busy !== null}
                  aria-label={`${row.nameBn} নিচে নামান`}
                  className="rounded-md border p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronDown aria-hidden className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                <input
                  value={draft.nameBn}
                  onChange={(e) => setDraft(row.id, "nameBn", e.target.value)}
                  aria-label={`${row.key} — বাংলা নাম`}
                  placeholder="বাংলা নাম"
                  dir="rtl"
                  className="w-full rounded-md border bg-card px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary/50"
                />
                <input
                  value={draft.nameEn}
                  onChange={(e) => setDraft(row.id, "nameEn", e.target.value)}
                  aria-label={`${row.key} — ইংরেজি নাম`}
                  placeholder="English name"
                  dir="ltr"
                  className="w-full rounded-md border bg-card px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary/50"
                />
              </div>
              {dirty(row) && (
                <button
                  type="button"
                  onClick={() => void rename(row)}
                  disabled={busy === row.id}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-primary/40 px-2.5 py-1 text-[11.5px] font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  {busy === row.id ? <Loader2 aria-hidden className="h-3 w-3 animate-spin" /> : <Check aria-hidden className="h-3 w-3" />}
                  সংরক্ষণ
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
