"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { BilingualField } from "@/components/admin/ui/bilingual-field";
import { formatNumber } from "@/lib/format";

interface MenuItemRow {
  id: string;
  location: string;
  labelBn: string;
  labelEn: string;
  href: string;
  parentId: string | null;
  sortOrder: number;
  isVisible: boolean;
  flagKey: string | null;
}

interface FlagOption {
  key: string;
  labelBn: string;
  isEnabled: boolean;
}

type Draft = {
  location: string;
  labelBn: string;
  labelEn: string;
  href: string;
  parentId: string;
  sortOrder: number;
  isVisible: boolean;
  flagKey: string;
};

const LOCATIONS: { value: string; label: string; hint: string }[] = [
  { value: "HEADER_MAIN", label: "হেডার মেনু", hint: "ডেস্কটপ মেগা-মেনু ও মোবাইল অ্যাকর্ডিয়ন" },
  { value: "HEADER_UTILITY", label: "ইউটিলিটি বার", hint: "হেডারের উপরের সরু বার" },
  { value: "FOOTER_PRIMARY", label: "ফুটার (মূল)", hint: "ফুটারের দ্রুত লিংক কলাম" },
  { value: "FOOTER_SECONDARY", label: "ফুটার (সহায়ক)", hint: "ফুটারের রিসোর্স কলাম" },
  { value: "MOBILE", label: "মোবাইল এক্সট্রা", hint: "শুধু মোবাইল ড্রয়ারে দেখাবে" },
];

const EMPTY_DRAFT: Draft = {
  location: "HEADER_MAIN",
  labelBn: "",
  labelEn: "",
  href: "/",
  parentId: "",
  sortOrder: 0,
  isVisible: true,
  flagKey: "",
};

const inputClass = "w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50";

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

/** Two-level menu tree editor per location, with reorder + visibility + flag binding. */
export function MenusManager({ items, flags }: { items: MenuItemRow[]; flags: FlagOption[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItemRow | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState("HEADER_MAIN");

  const parents = useMemo(
    () => items.filter((item) => item.location === "HEADER_MAIN" && !item.parentId),
    [items],
  );

  const locationItems = useMemo(
    () => items.filter((item) => item.location === activeLocation),
    [items, activeLocation],
  );

  const rowsByParent = useMemo(() => {
    const top = locationItems.filter((item) => !item.parentId);
    return top.map((parent) => ({
      parent,
      children: locationItems.filter((item) => item.parentId === parent.id),
    }));
  }, [locationItems]);

  function openCreate() {
    setEditing(null);
    setDraft({
      ...EMPTY_DRAFT,
      location: activeLocation,
      sortOrder: locationItems.length,
    });
    setDialogOpen(true);
  }

  function openEdit(row: MenuItemRow) {
    setEditing(row);
    setDraft({
      location: row.location,
      labelBn: row.labelBn,
      labelEn: row.labelEn,
      href: row.href,
      parentId: row.parentId ?? "",
      sortOrder: row.sortOrder,
      isVisible: row.isVisible,
      flagKey: row.flagKey ?? "",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    const payload = {
      location: draft.location,
      labelBn: draft.labelBn,
      labelEn: draft.labelEn,
      href: draft.href,
      parentId: draft.parentId || null,
      sortOrder: draft.sortOrder,
      isVisible: draft.isVisible,
      flagKey: draft.flagKey || null,
    };
    const result = editing
      ? await api(`/api/admin/menus/${editing.id}`, "PATCH", payload)
      : await api("/api/admin/menus", "POST", payload);
    setSaving(false);
    if (!result.ok) {
      const detail = result.fields ? ` (${Object.values(result.fields)[0] ?? ""})` : "";
      toast({ title: `${result.error ?? "সংরক্ষণ করা যায়নি"}${detail}`, variant: "destructive" });
      return;
    }
    setDialogOpen(false);
    toast({ title: editing ? "মেনু আইটেম সংরক্ষিত হয়েছে" : "নতুন মেনু আইটেম যোগ হয়েছে" });
    router.refresh();
  }

  async function move(row: MenuItemRow, direction: "up" | "down") {
    setBusyId(row.id);
    const result = await api(`/api/admin/menus/${row.id}`, "PATCH", { direction });
    setBusyId(null);
    if (!result.ok) {
      toast({ title: result.error ?? "সরানো যায়নি", variant: "destructive" });
      return;
    }
    router.refresh();
  }

  async function toggleVisible(row: MenuItemRow, isVisible: boolean) {
    setBusyId(row.id);
    const result = await api(`/api/admin/menus/${row.id}`, "PATCH", { isVisible });
    setBusyId(null);
    if (!result.ok) {
      toast({ title: result.error ?? "পরিবর্তন করা যায়নি", variant: "destructive" });
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    setBusyId(id);
    const result = await api(`/api/admin/menus/${id}`, "DELETE");
    setBusyId(null);
    setConfirmId(null);
    if (!result.ok) {
      toast({ title: result.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
      return;
    }
    toast({ title: "মেনু আইটেমটি মুছে ফেলা হয়েছে" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Location tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="মেনুর অবস্থান" className="flex flex-wrap gap-1 rounded-xl border bg-secondary/40 p-1">
          {LOCATIONS.map((location) => (
            <button
              key={location.value}
              type="button"
              role="tab"
              aria-selected={activeLocation === location.value}
              onClick={() => setActiveLocation(location.value)}
              className={
                activeLocation === location.value
                  ? "rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground"
                  : "rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {location.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus aria-hidden className="h-4 w-4" />
          নতুন আইটেম
        </Button>
      </div>

      <p className="text-[12px] text-muted-foreground">
        {LOCATIONS.find((l) => l.value === activeLocation)?.hint} · {formatNumber(locationItems.length, "bn")}টি আইটেম
      </p>

      {/* Tree */}
      {rowsByParent.length === 0 ? (
        <div className="rounded-2xl border bg-card px-6 py-14 text-center">
          <p className="font-heading text-lg font-bold">এই অবস্থানে কোনো মেনু নেই</p>
          <p className="mt-1 text-sm text-muted-foreground">
            ফলব্যাক হিসেবে স্ট্যাটিক নেভিগেশন দেখানো হচ্ছে — এখানে আইটেম যোগ করলে সেটিই চলবে।
          </p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus aria-hidden className="h-4 w-4" />
            আইটেম যোগ করুন
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {rowsByParent.map(({ parent, children }) => (
            <li key={parent.id} className="rounded-2xl border bg-card shadow-sm">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => void move(parent, "up")}
                    aria-label={`${parent.labelBn} উপরে`}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <ArrowUp aria-hidden className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void move(parent, "down")}
                    aria-label={`${parent.labelBn} নিচে`}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <ArrowDown aria-hidden className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">
                    {parent.labelBn}
                    <span className="ml-2 text-[11.5px] font-normal text-muted-foreground">{parent.labelEn}</span>
                  </p>
                  <p dir="ltr" className="truncate text-[11.5px] text-muted-foreground">
                    {parent.href}
                    {parent.flagKey ? ` · ফ্ল্যাগ: ${parent.flagKey}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {busyId === parent.id ? <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                  <Switch
                    checked={parent.isVisible}
                    onCheckedChange={(checked) => void toggleVisible(parent, checked)}
                    aria-label={`${parent.labelBn} ${parent.isVisible ? "লুকান" : "দেখান"}`}
                  />
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                    {parent.isVisible ? <Eye aria-hidden className="h-3 w-3" /> : <EyeOff aria-hidden className="h-3 w-3" />}
                    {formatNumber(children.length, "bn")} সাব
                  </span>
                  <Button type="button" variant="ghost" size="sm" aria-label="সম্পাদনা" onClick={() => openEdit(parent)}>
                    <Pencil aria-hidden className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="মুছুন"
                    onClick={() => setConfirmId(parent.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {children.length > 0 ? (
                <ul className="divide-y border-t">
                  {children.map((child) => (
                    <li key={child.id} className="flex flex-wrap items-center gap-3 py-2.5 pl-8 pr-4">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => void move(child, "up")}
                          aria-label={`${child.labelBn} উপরে`}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <ArrowUp aria-hidden className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void move(child, "down")}
                          aria-label={`${child.labelBn} নিচে`}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <ArrowDown aria-hidden className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium">
                          {child.labelBn}
                          <span className="ml-2 text-[11px] font-normal text-muted-foreground">{child.labelEn}</span>
                        </p>
                        <p dir="ltr" className="truncate text-[11px] text-muted-foreground">
                          {child.href}
                          {child.flagKey ? ` · ফ্ল্যাগ: ${child.flagKey}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {busyId === child.id ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
                        <Switch
                          checked={child.isVisible}
                          onCheckedChange={(checked) => void toggleVisible(child, checked)}
                          aria-label={`${child.labelBn} ${child.isVisible ? "লুকান" : "দেখান"}`}
                        />
                        <Button type="button" variant="ghost" size="sm" aria-label="সম্পাদনা" onClick={() => openEdit(child)}>
                          <Pencil aria-hidden className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="মুছুন"
                          onClick={() => setConfirmId(child.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
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

      {/* Editor dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "মেনু আইটেম সম্পাদনা" : "নতুন মেনু আইটেম"}</DialogTitle>
            <DialogDescription>দুই ভাষার লেবেল দিন — ইংরেজি খালি রাখলে বাংলাটি দেখায়।</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">অবস্থান</span>
              <Select value={draft.location} onValueChange={(value) => setDraft({ ...draft, location: value })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <BilingualField label="লেবেল" required stacked={false}>
              {(active) => (
                <Input
                  dir="ltr"
                  value={active === "bn" ? draft.labelBn : draft.labelEn}
                  onChange={(e) => setDraft(active === "bn" ? { ...draft, labelBn: e.target.value } : { ...draft, labelEn: e.target.value })}
                  placeholder={active === "bn" ? "আমাদের সম্পর্কে" : "About us"}
                  className={inputClass}
                />
              )}
            </BilingualField>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">লিংক (href)</span>
              <Input
                dir="ltr"
                value={draft.href}
                onChange={(e) => setDraft({ ...draft, href: e.target.value })}
                placeholder="/about"
                className={inputClass}
              />
              <span className="block text-[11.5px] text-muted-foreground">
                প্রকাশ্য সাইটের পথ দিন — / দিয়ে শুরু; ভাষা প্রিফিক্স স্বয়ংক্রিয়।
              </span>
            </label>

            {draft.location === "HEADER_MAIN" ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">প্যারেন্ট (সাব-মেনু হলে)</span>
                <Select value={draft.parentId || "none"} onValueChange={(value) => setDraft({ ...draft, parentId: value === "none" ? "" : value })}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="শীর্ষ স্তরের আইটেম" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— শীর্ষ স্তর —</SelectItem>
                    {parents
                      .filter((parent) => parent.id !== editing?.id)
                      .map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.labelBn}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </label>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">ফিচার ফ্ল্যাগ (ঐচ্ছিক)</span>
              <Select value={draft.flagKey || "none"} onValueChange={(value) => setDraft({ ...draft, flagKey: value === "none" ? "" : value })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="কোনো ফ্ল্যাগ নয়" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— কোনো ফ্ল্যাগ নয় —</SelectItem>
                  {flags.map((flag) => (
                    <SelectItem key={flag.key} value={flag.key}>
                      {flag.labelBn} ({flag.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="block text-[11.5px] text-muted-foreground">
                ফ্ল্যাগ বন্ধ থাকলে এই আইটেম নেভিগেশন থেকে লুকিয়ে যায়।
              </span>
            </label>

            <div className="flex items-center justify-between rounded-xl border bg-secondary/30 p-3.5">
              <div>
                <p className="text-sm font-semibold">দৃশ্যমান</p>
                <p className="text-[11.5px] text-muted-foreground">বন্ধ করলে প্রকাশ্য নেভিগেশনে দেখাবে না।</p>
              </div>
              <Switch checked={draft.isVisible} onCheckedChange={(checked) => setDraft({ ...draft, isVisible: checked })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={save} disabled={saving || !draft.labelBn.trim()}>
              {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
              সংরক্ষণ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title="মেনু আইটেমটি মুছে ফেলবেন?"
        description="সাব-মেনু থাকলে আগে সেগুলো সরাতে হবে। এই কাজ ফিরিয়ে আনা যায় না।"
        confirmLabel="স্থায়ীভাবে মুছুন"
        onConfirm={() => confirmId && remove(confirmId)}
      />
    </div>
  );
}
