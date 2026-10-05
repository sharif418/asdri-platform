"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/format";

export interface TeamRow {
  id: string;
  key: string;
  nameBn: string;
  nameEn: string;
  sortOrder: number;
  peopleCount: number;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Teams management section — add, rename, reorder (up/down), delete. */
export function TeamsManager({ teams }: { teams: TeamRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<TeamRow[]>(teams);
  const [newKey, setNewKey] = useState("");
  const [newNameBn, setNewNameBn] = useState("");
  const [newNameEn, setNewNameEn] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  function patchRow(id: string, patch: Partial<TeamRow>) {
    setRows((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function saveTeam(row: TeamRow) {
    if (busyId) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/teams/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ key: row.key, nameBn: row.nameBn, nameEn: row.nameEn }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: `${row.nameBn} সংরক্ষিত` });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  async function removeTeam(row: TeamRow) {
    if (busyId) return;
    if (!window.confirm(`'${row.nameBn}' দলটি মুছে ফেলা হবে। নিশ্চিত?`)) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/teams/${row.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken() },
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        toast({ title: json?.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "দল মুছে ফেলা হয়েছে" });
      setRows((list) => list.filter((r) => r.id !== row.id));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length || savingOrder) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    setSavingOrder(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ order: next.map((row, i) => ({ id: row.id, sortOrder: i })) }),
      });
      if (!res.ok) {
        toast({ title: "ক্রম সংরক্ষণ করা যায়নি", variant: "destructive" });
        router.refresh();
        return;
      }
      router.refresh();
    } finally {
      setSavingOrder(false);
    }
  }

  async function createTeam() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({
          key: newKey.trim(),
          nameBn: newNameBn.trim(),
          nameEn: newNameEn.trim(),
          sortOrder: rows.length,
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string> };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "দল তৈরি করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "নতুন দল তৈরি হয়েছে" });
      setNewKey("");
      setNewNameBn("");
      setNewNameEn("");
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading flex items-center gap-2 text-base font-bold">দল ব্যবস্থাপনা</h2>
        <p className="text-[11.5px] text-muted-foreground">
          {savingOrder ? "ক্রম সংরক্ষিত হচ্ছে…" : `মোট ${formatNumber(rows.length, "bn")} টি দল — নাম বদলান, উপরে-নিচে সরান`}
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((row, index) => (
          <li key={row.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-background/50 px-3 py-2">
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={() => void move(index, -1)}
                disabled={index === 0 || savingOrder}
                aria-label={`${row.nameBn} উপরে নিন`}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp aria-hidden className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void move(index, 1)}
                disabled={index === rows.length - 1 || savingOrder}
                aria-label={`${row.nameBn} নিচে নামান`}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown aria-hidden className="h-3.5 w-3.5" />
              </button>
            </div>
            <input
              value={row.nameBn}
              onChange={(e) => patchRow(row.id, { nameBn: e.target.value })}
              aria-label={`${row.key} — বাংলা নাম`}
              dir="rtl"
              className="min-w-32 flex-1 rounded-lg border bg-card px-2.5 py-1.5 text-[13px] outline-none focus:border-primary/50"
            />
            <input
              value={row.nameEn}
              onChange={(e) => patchRow(row.id, { nameEn: e.target.value })}
              aria-label={`${row.key} — English name`}
              className="hidden min-w-32 flex-1 rounded-lg border bg-card px-2.5 py-1.5 text-[13px] outline-none focus:border-primary/50 sm:block"
            />
            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {formatNumber(row.peopleCount, "bn")} জন
            </span>
            <button
              type="button"
              onClick={() => void saveTeam(row)}
              disabled={busyId === row.id}
              aria-label={`${row.nameBn} সংরক্ষণ করুন`}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold hover:bg-secondary disabled:opacity-40"
            >
              {busyId === row.id ? <Loader2 aria-hidden className="h-3 w-3 animate-spin" /> : <Save aria-hidden className="h-3 w-3" />}
              সংরক্ষণ
            </button>
            <button
              type="button"
              onClick={() => void removeTeam(row)}
              disabled={busyId === row.id || row.peopleCount > 0}
              aria-label={`${row.nameBn} মুছে ফেলুন`}
              title={row.peopleCount > 0 ? "দলে সদস্য থাকায় মুছে ফেলা যাবে না" : "দল মুছে ফেলুন"}
              className="inline-flex items-center rounded-lg border border-destructive/30 px-2 py-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              {busyId === row.id ? <Loader2 aria-hidden className="h-3 w-3 animate-spin" /> : <Trash2 aria-hidden className="h-3.5 w-3.5" />}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="কী (english-key)"
          aria-label="নতুন দলের কী"
          className="w-36 rounded-lg border bg-card px-2.5 py-2 text-[13px] outline-none focus:border-primary/50"
        />
        <input
          value={newNameBn}
          onChange={(e) => setNewNameBn(e.target.value)}
          placeholder="বাংলা নাম"
          aria-label="নতুন দলের বাংলা নাম"
          dir="rtl"
          className="min-w-32 flex-1 rounded-lg border bg-card px-2.5 py-2 text-[13px] outline-none focus:border-primary/50"
        />
        <input
          value={newNameEn}
          onChange={(e) => setNewNameEn(e.target.value)}
          placeholder="English name"
          aria-label="নতুন দলের ইংরেজি নাম"
          className="hidden min-w-32 flex-1 rounded-lg border bg-card px-2.5 py-2 text-[13px] outline-none focus:border-primary/50 sm:block"
        />
        <button
          type="button"
          onClick={() => void createTeam()}
          disabled={creating || !newKey.trim() || !newNameBn.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {creating ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : <Plus aria-hidden className="h-3.5 w-3.5" />}
          নতুন দল
        </button>
      </div>
    </section>
  );
}
