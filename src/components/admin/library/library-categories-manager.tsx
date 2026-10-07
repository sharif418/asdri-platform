"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { toBnDigits } from "@/lib/format";

interface CategoryRow {
  id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  parentId: string | null;
  sortOrder: number;
  _count: { items: number; children: number };
}

type Draft = {
  nameBn: string;
  nameEn: string;
  parentId: string;
  sortOrder: number;
};

const EMPTY_DRAFT: Draft = { nameBn: "", nameEn: "", parentId: "", sortOrder: 0 };

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

async function api(
  url: string,
  method: string,
  body?: unknown,
): Promise<{ ok: boolean; error?: string; fields?: Record<string, string> }> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Record<string, string> };
  return { ok: res.ok && json.ok !== false, error: json.error, fields: json.fields };
}

/** Two-level category tree manager — reorder, edit, delete (guarded by items). */
export function LibraryCategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const rowsByParent = useMemo(() => {
    const top = categories.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
    return top.map((parent) => ({
      parent,
      children: categories.filter((c) => c.parentId === parent.id).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }, [categories]);

  function openCreate(parentId = "") {
    setEditing(null);
    setDraft({ ...EMPTY_DRAFT, parentId, sortOrder: categories.filter((c) => (parentId ? c.parentId === parentId : !c.parentId)).length });
    setDialogOpen(true);
  }

  function openEdit(row: CategoryRow) {
    setEditing(row);
    setDraft({ nameBn: row.nameBn, nameEn: row.nameEn, parentId: row.parentId ?? "", sortOrder: row.sortOrder });
    setDialogOpen(true);
  }

  async function save() {
    if (saving || draft.nameBn.trim().length < 2) return;
    setSaving(true);
    const payload = { nameBn: draft.nameBn.trim(), nameEn: draft.nameEn.trim(), parentId: draft.parentId || null, sortOrder: draft.sortOrder };
    const result = editing ? await api(`/api/admin/library/categories/${editing.id}`, "PATCH", payload) : await api("/api/admin/library/categories", "POST", payload);
    setSaving(false);
    if (!result.ok) {
      const detail = result.fields ? ` (${Object.values(result.fields)[0] ?? ""})` : "";
      toast({ title: `${result.error ?? "সংরক্ষণ করা যায়নি"}${detail}`, variant: "destructive" });
      return;
    }
    setDialogOpen(false);
    toast({ title: editing ? "ক্যাটাগরি সংরক্ষিত হয়েছে" : "নতুন ক্যাটাগরি যোগ হয়েছে" });
    router.refresh();
  }

  async function move(row: CategoryRow, direction: "up" | "down") {
    setBusyId(row.id);
    const result = await api(`/api/admin/library/categories/${row.id}`, "PATCH", { direction });
    setBusyId(null);
    if (!result.ok) {
      toast({ title: result.error ?? "সরানো যায়নি", variant: "destructive" });
      return;
    }
    router.refresh();
  }

  async function remove(row: CategoryRow) {
    setBusyId(row.id);
    const result = await api(`/api/admin/library/categories/${row.id}`, "DELETE");
    setBusyId(null);
    setConfirmId(null);
    if (!result.ok) {
      toast({ title: result.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
      return;
    }
    toast({ title: "ক্যাটাগরিটি মুছে ফেলা হয়েছে" });
    router.refresh();
  }

  const topLevels = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">দুই স্তরের গাছ — ক্যাটাগরি ও উপক্যাটাগরি · {toBnDigits(categories.length)}টি ক্যাটাগরি</p>
        <Button size="sm" onClick={() => openCreate()}>
          <Plus aria-hidden className="h-4 w-4" />
          নতুন ক্যাটাগরি
        </Button>
      </div>

      {rowsByParent.length === 0 ? (
        <div className="rounded-2xl border bg-card px-6 py-14 text-center">
          <p className="font-heading text-lg font-bold">কোনো ক্যাটাগরি নেই</p>
          <p className="mt-1 text-sm text-muted-foreground">ইসলামী আকীদা, হাদীস ও সুন্নাহ, ফিকহ… — তালিকা গুছিয়ে সাজান।</p>
          <Button size="sm" className="mt-4" onClick={() => openCreate()}>
            <Plus aria-hidden className="h-4 w-4" />
            ক্যাটাগরি যোগ করুন
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {rowsByParent.map(({ parent, children }) => (
            <li key={parent.id} className="rounded-2xl border bg-card shadow-sm">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex flex-col">
                  <button type="button" onClick={() => void move(parent, "up")} aria-label={`${parent.nameBn} উপরে`} className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <ArrowUp aria-hidden className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => void move(parent, "down")} aria-label={`${parent.nameBn} নিচে`} className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <ArrowDown aria-hidden className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">
                    {parent.nameBn}
                    <span className="ml-2 text-[11.5px] font-normal text-muted-foreground">{parent.nameEn}</span>
                  </p>
                  <p dir="ltr" className="truncate text-[11.5px] text-muted-foreground">
                    {parent.slug} · {toBnDigits(parent._count.items)} আইটেম
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {busyId === parent.id ? <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                    {toBnDigits(children.length)} উপক্যাটাগরি
                  </span>
                  <Button type="button" variant="ghost" size="sm" aria-label={`${parent.nameBn} এ উপক্যাটাগরি যোগ করুন`} onClick={() => openCreate(parent.id)}>
                    <Plus aria-hidden className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" aria-label={`${parent.nameBn} সম্পাদনা`} onClick={() => openEdit(parent)}>
                    <Pencil aria-hidden className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" aria-label={`${parent.nameBn} মুছুন`} onClick={() => setConfirmId(parent.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {children.length > 0 ? (
                <ul className="divide-y border-t">
                  {children.map((child) => (
                    <li key={child.id} className="flex flex-wrap items-center gap-3 py-2.5 pl-8 pr-4">
                      <div className="flex flex-col">
                        <button type="button" onClick={() => void move(child, "up")} aria-label={`${child.nameBn} উপরে`} className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                          <ArrowUp aria-hidden className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => void move(child, "down")} aria-label={`${child.nameBn} নিচে`} className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                          <ArrowDown aria-hidden className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium">
                          {child.nameBn}
                          <span className="ml-2 text-[11px] font-normal text-muted-foreground">{child.nameEn}</span>
                        </p>
                        <p dir="ltr" className="truncate text-[11px] text-muted-foreground">
                          {child.slug} · {toBnDigits(child._count.items)} আইটেম
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {busyId === child.id ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
                        <Button type="button" variant="ghost" size="sm" aria-label={`${child.nameBn} সম্পাদনা`} onClick={() => openEdit(child)}>
                          <Pencil aria-hidden className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" aria-label={`${child.nameBn} মুছুন`} onClick={() => setConfirmId(child.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 aria-hidden className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "ক্যাটাগরি সম্পাদনা" : "নতুন ক্যাটাগরি"}</DialogTitle>
            <DialogDescription>দুই ভাষার নাম দিন — ইংরেজি খালি রাখলে বাংলাটি দেখায়।</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">বাংলা নাম</span>
              <Input value={draft.nameBn} onChange={(e) => setDraft({ ...draft, nameBn: e.target.value })} placeholder="ইসলামী আকীদা" className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">ইংরেজি নাম</span>
              <Input dir="ltr" value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} placeholder="Islamic Creed" className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">প্যারেন্ট (উপক্যাটাগরি হলে)</span>
              <select
                value={draft.parentId}
                onChange={(e) => setDraft({ ...draft, parentId: e.target.value })}
                disabled={editing != null && editing.parentId != null}
                className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              >
                <option value="">— শীর্ষ স্তর —</option>
                {topLevels
                  .filter((parent) => parent.id !== editing?.id)
                  .map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.nameBn}
                    </option>
                  ))}
              </select>
              <span className="block text-[11.5px] text-muted-foreground">উপক্যাটাগরি শীর্ষ স্তরে সরানো যায় না — নতুন করে তৈরি করুন।</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={save} disabled={saving || draft.nameBn.trim().length < 2}>
              {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
              সংরক্ষণ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title="ক্যাটাগরিটি মুছে ফেলবেন?"
        description="আইটেম আটকে থাকলে মুছে ফেলা যাবে না — আগে সেগুলো অন্য ক্যাটাগরিতে সরান। উপক্যাটাগরি থাকলে সেগুলো শীর্ষ স্তরে চলে যাবে।"
        confirmLabel="স্থায়ীভাবে মুছুন"
        onConfirm={() => {
          const row = categories.find((c) => c.id === confirmId);
          if (row) void remove(row);
        }}
      />
    </div>
  );
}
