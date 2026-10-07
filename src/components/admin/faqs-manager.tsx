"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { BilingualField } from "@/components/admin/ui/bilingual-field";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface FaqRow {
  id: string;
  categoryBn: string;
  categoryEn: string;
  questionBn: string;
  questionEn: string;
  answerBn: string;
  answerEn: string;
  sortOrder: number;
  isPublished: boolean;
}

type Draft = Omit<FaqRow, "id">;

const EMPTY_DRAFT: Draft = {
  categoryBn: "সাধারণ",
  categoryEn: "General",
  questionBn: "",
  questionEn: "",
  answerBn: "",
  answerEn: "",
  sortOrder: 0,
  isPublished: true,
};

const inputClass = "w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50";

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

async function api(url: string, method: string, body?: unknown): Promise<{ ok: boolean; error?: string; fields?: Record<string, string> }> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Record<string, string> };
  return { ok: res.ok && json.ok !== false, error: json.error, fields: json.fields };
}

/** FAQ CRUD: grouped table + bilingual dialog form. */
export function FaqsManager({ faqs }: { faqs: FaqRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FaqRow | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, FaqRow[]>();
    for (const faq of faqs) {
      const key = faq.categoryBn || "সাধারণ";
      map.set(key, [...(map.get(key) ?? []), faq]);
    }
    return [...map.entries()];
  }, [faqs]);

  function openCreate() {
    setEditing(null);
    setDraft({ ...EMPTY_DRAFT, sortOrder: faqs.length });
    setDialogOpen(true);
  }

  function openEdit(row: FaqRow) {
    setEditing(row);
    const { id, ...rest } = row;
    void id;
    setDraft(rest);
    setDialogOpen(true);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    const result = editing
      ? await api(`/api/admin/faqs/${editing.id}`, "PATCH", draft)
      : await api("/api/admin/faqs", "POST", draft);
    setSaving(false);
    if (!result.ok) {
      toast({ title: result.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
      return;
    }
    setDialogOpen(false);
    toast({ title: editing ? "প্রশ্নোত্তর সংরক্ষিত হয়েছে" : "নতুন প্রশ্নোত্তর যোগ হয়েছে" });
    router.refresh();
  }

  async function togglePublish(row: FaqRow, isPublished: boolean) {
    setBusyId(row.id);
    const result = await api(`/api/admin/faqs/${row.id}`, "PATCH", { isPublished });
    setBusyId(null);
    if (!result.ok) {
      toast({ title: result.error ?? "পরিবর্তন করা যায়নি", variant: "destructive" });
      return;
    }
    toast({ title: isPublished ? "প্রকাশিত হয়েছে" : "লুকানো হয়েছে" });
    router.refresh();
  }

  async function remove(id: string) {
    setBusyId(id);
    const result = await api(`/api/admin/faqs/${id}`, "DELETE");
    setBusyId(null);
    setConfirmId(null);
    if (!result.ok) {
      toast({ title: result.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
      return;
    }
    toast({ title: "প্রশ্নোত্তরটি মুছে ফেলা হয়েছে" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus aria-hidden className="h-4 w-4" />
          নতুন প্রশ্নোত্তর
        </Button>
      </div>

      {faqs.length === 0 ? (
        <div className="rounded-2xl border bg-card px-6 py-14 text-center">
          <p className="font-heading text-lg font-bold">এখনো কোনো প্রশ্নোত্তর নেই</p>
          <p className="mt-1 text-sm text-muted-foreground">ভর্তি প্রশ্নোত্তর পেজ খালি থাকবে — প্রথমটি যোগ করুন।</p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus aria-hidden className="h-4 w-4" />
            প্রশ্নোত্তর যোগ করুন
          </Button>
        </div>
      ) : (
        grouped.map(([category, rows]) => (
          <section key={category} className="rounded-2xl border bg-card shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b p-4">
              <h2 className="font-heading text-[15px] font-bold">{category}</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {formatNumber(rows.length, "bn")}টি
              </span>
            </header>
            <ul className="divide-y">
              {rows.map((row) => (
                <li key={row.id} className="flex flex-wrap items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold">{row.questionBn}</p>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                      {row.answerBn}
                    </p>
                    {!row.questionEn && !row.answerEn ? (
                      <p className="mt-1 text-[11px] text-gold">English অনুবাদ নেই</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {busyId === row.id ? <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold",
                        row.isPublished ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {row.isPublished ? "প্রকাশিত" : "অপ্রকাশিত"}
                    </span>
                    <Switch
                      checked={row.isPublished}
                      onCheckedChange={(checked) => void togglePublish(row, checked)}
                      aria-label={`${row.questionBn} — ${row.isPublished ? "প্রকাশিত" : "অপ্রকাশিত"}`}
                    />
                    <Button type="button" variant="ghost" size="sm" aria-label="সম্পাদনা" onClick={() => openEdit(row)}>
                      <Pencil aria-hidden className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="মুছুন"
                      onClick={() => setConfirmId(row.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editing ? "প্রশ্নোত্তর সম্পাদনা" : "নতুন প্রশ্নোত্তর"}
            </DialogTitle>
            <DialogDescription>দুই ভাষার ঘরই পূরণ করা ভালো — ইংরেজি খালি রাখলে বাংলাটি দেখায়।</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <BilingualField label="ক্যাটাগরি" stacked={false}>
              {(active) => (
                <Input
                  dir="ltr"
                  value={active === "bn" ? draft.categoryBn : draft.categoryEn}
                  onChange={(e) => setDraft(active === "bn" ? { ...draft, categoryBn: e.target.value } : { ...draft, categoryEn: e.target.value })}
                  placeholder={active === "bn" ? "সাধারণ" : "General"}
                  className="h-9 text-[13.5px]"
                />
              )}
            </BilingualField>

            <BilingualField label="প্রশ্ন" required>
              {(active) => (
                <Textarea
                  dir="ltr"
                  rows={2}
                  value={active === "bn" ? draft.questionBn : draft.questionEn}
                  onChange={(e) => setDraft(active === "bn" ? { ...draft, questionBn: e.target.value } : { ...draft, questionEn: e.target.value })}
                  placeholder={active === "bn" ? "ভর্তি পরীক্ষার জন্য কী প্রস্তুতি লাগে?" : "The question, in English"}
                  className={inputClass}
                />
              )}
            </BilingualField>

            <BilingualField label="উত্তর" required>
              {(active) => (
                <Textarea
                  dir="ltr"
                  rows={4}
                  value={active === "bn" ? draft.answerBn : draft.answerEn}
                  onChange={(e) => setDraft(active === "bn" ? { ...draft, answerBn: e.target.value } : { ...draft, answerEn: e.target.value })}
                  placeholder={active === "bn" ? "বিস্তারিত উত্তর…" : "The answer, in English"}
                  className={inputClass}
                />
              )}
            </BilingualField>

            <div className="flex items-center justify-between rounded-xl border bg-secondary/30 p-3.5">
              <div>
                <p className="text-sm font-semibold">প্রকাশিত</p>
                <p className="text-[11.5px] text-muted-foreground">বন্ধ করলে প্রশ্নোত্তর পেজে দেখাবে না।</p>
              </div>
              <Switch checked={draft.isPublished} onCheckedChange={(checked) => setDraft({ ...draft, isPublished: checked })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={save} disabled={saving || !draft.questionBn.trim() || !draft.answerBn.trim()}>
              {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
              সংরক্ষণ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title={`‘${faqs.find((row) => row.id === confirmId)?.questionBn ?? "এই"}’ প্রশ্নোত্তরটি মুছে ফেলবেন?`}
        description="এটি ভর্তি প্রশ্নোত্তর পেজ থেকে স্থায়ীভাবে সরে যাবে।"
        confirmLabel="স্থায়ীভাবে মুছুন"
        onConfirm={() => confirmId && remove(confirmId)}
      />
    </div>
  );
}
