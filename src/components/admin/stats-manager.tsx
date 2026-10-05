"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { formatNumber, toBnDigits } from "@/lib/format";

interface StatRow {
  id: string;
  value: number;
  suffixBn: string;
  suffixEn: string;
  labelBn: string;
  labelEn: string;
  sortOrder: number;
  isPublished: boolean;
}

interface Draft {
  value: string;
  suffixBn: string;
  suffixEn: string;
  labelBn: string;
  labelEn: string;
}

const inputClass = "h-9 w-full rounded-lg border bg-card px-3 text-[13px] outline-none focus:border-primary/50";

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

async function api(url: string, method: string, body?: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  return { ok: res.ok && json.ok !== false, error: json.error };
}

/** The home "এক নজরে" stats band editor: inline edit, add, delete, publish toggle. */
export function StatsManager({ stats }: { stats: StatRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(stats);
  const [draft, setDraft] = useState<Draft>({ value: "", suffixBn: "", suffixEn: "", labelBn: "", labelEn: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function saveRow(row: StatRow, fields: Partial<StatRow>) {
    setBusy(row.id);
    const payload: Record<string, unknown> = { ...fields };
    if (fields.value !== undefined) payload.value = Number(fields.value) || 0;
    const result = await api(`/api/admin/stats/${row.id}`, "PATCH", payload);
    setBusy(null);
    if (!result.ok) {
      toast({ title: result.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...fields } : r)));
    toast({ title: "পরিসংখ্যান সংরক্ষিত হয়েছে" });
    router.refresh();
  }

  async function create() {
    if (creating) return;
    setCreating(true);
    const result = await api("/api/admin/stats", "POST", {
      value: Number(draft.value) || 0,
      suffixBn: draft.suffixBn,
      suffixEn: draft.suffixEn,
      labelBn: draft.labelBn,
      labelEn: draft.labelEn,
      sortOrder: rows.length,
      isPublished: true,
    });
    setCreating(false);
    if (!result.ok) {
      toast({ title: result.error ?? "যোগ করা যায়নি", variant: "destructive" });
      return;
    }
    setDraft({ value: "", suffixBn: "", suffixEn: "", labelBn: "", labelEn: "" });
    toast({ title: "নতুন পরিসংখ্যান যোগ হয়েছে" });
    router.refresh();
  }

  async function remove(id: string) {
    setBusy(id);
    const result = await api(`/api/admin/stats/${id}`, "DELETE");
    setBusy(null);
    setConfirmId(null);
    if (!result.ok) {
      toast({ title: result.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "পরিসংখ্যানটি মুছে ফেলা হয়েছে" });
    router.refresh();
  }

  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="border-b p-5">
        <h2 className="font-heading text-base font-bold">“এক নজরে” পরিসংখ্যান</h2>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          সংখ্যাগুলো হোম পেজের ব্যান্ডে দেখায় — বাংলায় বাংলা সংখ্যায় রূপান্তরিত হয়। এখানে ল্যাটিন সংখ্যায় লিখুন।
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">এখনো কোনো পরিসংখ্যান নেই — নিচে যোগ করুন।</p>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 p-4">
              <label className="w-24">
                <span className="sr-only">সংখ্যা</span>
                <Input
                  dir="ltr"
                  defaultValue={String(row.value)}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (value !== row.value) void saveRow(row, { value });
                  }}
                  className={inputClass}
                  inputMode="numeric"
                />
              </label>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <Input
                  dir="ltr"
                  defaultValue={row.labelBn}
                  placeholder="বাংলা লেবেল"
                  className={inputClass}
                  onBlur={(e) => {
                    if (e.target.value !== row.labelBn) void saveRow(row, { labelBn: e.target.value });
                  }}
                />
                <Input
                  dir="ltr"
                  defaultValue={row.labelEn}
                  placeholder="English label"
                  className={inputClass}
                  onBlur={(e) => {
                    if (e.target.value !== row.labelEn) void saveRow(row, { labelEn: e.target.value });
                  }}
                />
                <Input
                  dir="ltr"
                  defaultValue={row.suffixBn}
                  placeholder="বাংলা প্রত্যয় (যেমন +)"
                  className={inputClass}
                  onBlur={(e) => {
                    if (e.target.value !== row.suffixBn) void saveRow(row, { suffixBn: e.target.value });
                  }}
                />
                <Input
                  dir="ltr"
                  defaultValue={row.suffixEn}
                  placeholder="English suffix"
                  className={inputClass}
                  onBlur={(e) => {
                    if (e.target.value !== row.suffixEn) void saveRow(row, { suffixEn: e.target.value });
                  }}
                />
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                {busy === row.id ? <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                <Switch
                  checked={row.isPublished}
                  onCheckedChange={(checked) => void saveRow(row, { isPublished: checked })}
                  aria-label={`${row.labelBn || "পরিসংখ্যান"} ${row.isPublished ? "লুকান" : "প্রকাশ"} করুন`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`${row.labelBn || "পরিসংখ্যান"} মুছুন`}
                  onClick={() => setConfirmId(row.id)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2 border-t bg-secondary/20 p-4">
        <label className="w-24">
          <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">সংখ্যা</span>
          <Input
            dir="ltr"
            inputMode="numeric"
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value.replace(/\D/g, "") })}
            placeholder="1200"
            className={inputClass}
          />
        </label>
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">বাংলা লেবেল</span>
          <Input
            dir="ltr"
            value={draft.labelBn}
            onChange={(e) => setDraft({ ...draft, labelBn: e.target.value })}
            placeholder="প্রশিক্ষিত দাঈ"
            className={inputClass}
          />
        </label>
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">English label</span>
          <Input
            dir="ltr"
            value={draft.labelEn}
            onChange={(e) => setDraft({ ...draft, labelEn: e.target.value })}
            placeholder="Trained du'at"
            className={inputClass}
          />
        </label>
        <Button type="button" size="sm" onClick={create} disabled={creating || !draft.labelBn.trim()}>
          {creating ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Plus aria-hidden className="h-4 w-4" />}
          যোগ করুন
        </Button>
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title="পরিসংখ্যানটি মুছে ফেলবেন?"
        description="এটি হোম পেজের “এক নজরে” ব্যান্ড থেকে স্থায়ীভাবে সরে যাবে।"
        confirmLabel="স্থায়ীভাবে মুছুন"
        onConfirm={() => confirmId && remove(confirmId)}
      />
      <p className="px-4 pb-4 text-[11px] text-muted-foreground">
        মোট {toBnDigits(rows.length)}টি সারি · {formatNumber(rows.filter((r) => r.isPublished).length, "bn")}টি প্রকাশিত
      </p>
    </section>
  );
}
