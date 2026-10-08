"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, GraduationCap, Link2, Link2Off, Loader2, Plus, Save, Search, Trash2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { adminConfirm } from "@/components/admin/ui/confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toBnDigits } from "@/lib/format";
import { ALUMNI_COURSE_LABELS } from "@/lib/alumni";

/**
 * Alumni registry manager (admissions office). One table over the office
 * ledger, one dialog for create/edit (the registry number is minted by the
 * API — the form never writes one), guarded deletes (a linked account must be
 * unlinked first, so a living alumnus's portal card is never orphaned) and a
 * one-click unlink for claimed rows (round 11) — no manual DB trip.
 */

interface AlumniRow {
  id: string;
  registryNo: string;
  userId: string | null;
  nameBn: string;
  nameEn: string;
  courseKey: string;
  batchYear: number;
  batchNoBn: string;
  occupationBn: string;
  organizationBn: string;
  districtBn: string;
  phone: string;
  email: string;
  addressBn: string;
  isPublished: boolean;
  updatedAt: string;
}

const COURSE_KEYS = ["PYS", "PGDID", "CCIS", "ATT"] as const;

const inputClass =
  "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50";

interface FormValues {
  nameBn: string;
  nameEn: string;
  courseKey: (typeof COURSE_KEYS)[number];
  batchYear: string;
  batchNoBn: string;
  occupationBn: string;
  organizationBn: string;
  districtBn: string;
  phone: string;
  email: string;
  addressBn: string;
  isPublished: boolean;
}

const EMPTY_FORM: FormValues = {
  nameBn: "",
  nameEn: "",
  courseKey: "PGDID",
  batchYear: String(new Date().getFullYear()),
  batchNoBn: "",
  occupationBn: "",
  organizationBn: "",
  districtBn: "",
  phone: "",
  email: "",
  addressBn: "",
  isPublished: false,
};

export function AlumniManager() {
  const router = useRouter();
  const [rows, setRows] = useState<AlumniRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AlumniRow | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AlumniRow | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/alumni${q ? `?q=${encodeURIComponent(q)}` : ""}`, { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data?: { items: AlumniRow[]; total: number }; error?: string };
      if (!res.ok || !json.ok || !json.data) {
        toast({ title: json.error ?? "তালিকা আনা যায়নি", variant: "destructive" });
        return;
      }
      setRows(json.data.items);
      setTotal(json.data.total);
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => void load(query.trim()), query.trim() ? 350 : 0);
    return () => clearTimeout(t);
  }, [query, load]);

  const summary = useMemo(
    () => (query.trim() ? `${toBnDigits(rows.length)} / ${toBnDigits(total)}টি রেকর্ড` : `${toBnDigits(total)}টি রেকর্ড`),
    [rows.length, total, query],
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(row: AlumniRow) {
    setEditing(row);
    setForm({
      nameBn: row.nameBn,
      nameEn: row.nameEn,
      courseKey: (COURSE_KEYS as readonly string[]).includes(row.courseKey)
        ? (row.courseKey as (typeof COURSE_KEYS)[number])
        : "PGDID",
      batchYear: String(row.batchYear),
      batchNoBn: row.batchNoBn,
      occupationBn: row.occupationBn,
      organizationBn: row.organizationBn,
      districtBn: row.districtBn,
      phone: row.phone,
      email: row.email,
      addressBn: row.addressBn,
      isPublished: row.isPublished,
    });
    setDialogOpen(true);
  }

  async function onSave() {
    if (saving) return;
    if (form.nameBn.trim().length < 3) {
      toast({ title: "বাংলা নাম কমপক্ষে ৩ অক্ষরের হতে হবে।", variant: "destructive" });
      return;
    }
    const year = Number.parseInt(form.batchYear, 10);
    if (!Number.isFinite(year) || year < 1990 || year > new Date().getFullYear() + 1) {
      toast({ title: "ব্যাচের সাল ঠিকভাবে দিন।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        nameBn: form.nameBn.trim(),
        nameEn: form.nameEn.trim(),
        courseKey: form.courseKey,
        batchYear: year,
        batchNoBn: form.batchNoBn.trim(),
        occupationBn: form.occupationBn.trim(),
        organizationBn: form.organizationBn.trim(),
        districtBn: form.districtBn.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        addressBn: form.addressBn.trim(),
        isPublished: form.isPublished,
      };
      const res = await fetch(editing ? `/api/admin/alumni/${editing.id}` : "/api/admin/alumni", {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "",
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        fields?: Record<string, string>;
        data?: { registryNo?: string };
      };
      if (!res.ok || !json.ok) {
        const firstField = json.fields ? Object.values(json.fields)[0] : null;
        toast({ title: firstField ?? json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({
        title: editing ? "রেকর্ড হালনাগাদ হয়েছে" : `রেকর্ড তৈরি হয়েছে — ${json.data?.registryNo ?? ""}`,
      });
      setDialogOpen(false);
      router.refresh();
      await load(query.trim());
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  /** One-click unlink for a claimed row (round 11) — confirm, then POST. */
  async function onUnlink(row: AlumniRow) {
    if (unlinking) return;
    const yes = await adminConfirm({
      title: "অ্যাকাউন্টের লিংক খুলে দিবেন?",
      description: `${row.registryNo} (${row.nameBn}) — প্রাক্তন শিক্ষার্থীর অ্যাকাউন্ট থাকবে, কিন্তু এই রেকর্ডের সঙ্গে আর যুক্ত থাকবে না। পরে তিনি পোর্টাল থেকে আবার যুক্ত হতে পারবেন।`,
      confirmLabel: "লিংক খুলে দিন",
    });
    if (!yes) return;
    setUnlinking(row.id);
    try {
      const res = await fetch(`/api/admin/alumni/${row.id}/unlink`, {
        method: "POST",
        headers: { "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "" },
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "লিংক খুলে দেওয়া যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: `${row.registryNo} — অ্যাকাউন্টের লিংক খুলে দেওয়া হয়েছে` });
      router.refresh();
      await load(query.trim());
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setUnlinking(null);
    }
  }

  async function onDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/alumni/${deleting.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "" },
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: `${deleting.registryNo} মুছে ফেলা হয়েছে` });
      setDeleting(null);
      router.refresh();
      await load(query.trim());
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম, রেজিস্ট্রি নম্বর বা ফোন দিয়ে খুঁজুন…"
            className="pl-9"
            aria-label="রেকর্ড খুঁজুন"
          />
        </div>
        <p className="text-[12px] text-muted-foreground">{loading ? "লোড হচ্ছে…" : summary}</p>
        <Button onClick={openCreate} className="ml-auto gap-1.5" size="sm">
          <Plus aria-hidden className="h-4 w-4" />
          নতুন রেকর্ড
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          রেজিস্ট্রি লোড হচ্ছে…
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center">
          <Users aria-hidden className="mx-auto h-8 w-8 text-gold" />
          <p className="mt-2 text-sm font-semibold">কোনো রেকর্ড নেই</p>
          <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
            সম্পন্ন হওয়া ব্যাচের শিক্ষার্থীদের এখানে যোগ করুন — রেজিস্ট্রি নম্বর স্বয়ংক্রিয়ভাবে তৈরি হবে।
          </p>
        </div>
      ) : (
        <div className="scrollbar-thin max-h-[62vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>শিক্ষার্থী</TableHead>
                <TableHead className="hidden md:table-cell">কার্যক্রম ও ব্যাচ</TableHead>
                <TableHead className="hidden lg:table-cell">বর্তমান পরিচয়</TableHead>
                <TableHead className="hidden sm:table-cell">যোগাযোগ</TableHead>
                <TableHead className="text-right">ভূমিকা</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => openEdit(row)}>
                  <TableCell className="max-w-[220px]">
                    <p className="truncate font-semibold">{row.nameBn}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-muted-foreground" dir="ltr">
                      {row.registryNo}
                      {row.userId ? (
                        <Link2 aria-label="অ্যাকাউন্ট যুক্ত" className="h-3 w-3 text-emerald-600" />
                      ) : null}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-[13px]">{ALUMNI_COURSE_LABELS[row.courseKey]?.bn ?? row.courseKey}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {toBnDigits(row.batchYear)}
                      {row.batchNoBn ? ` — ${row.batchNoBn}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] lg:table-cell">
                    <p className="truncate text-[13px]">{row.occupationBn || "—"}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{row.organizationBn || row.districtBn || "—"}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="text-[12.5px]" dir="ltr">{row.phone || "—"}</p>
                    <p className="truncate text-[11.5px] text-muted-foreground" dir="ltr">{row.email || "—"}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {row.isPublished ? (
                        <Badge className="gap-1 border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                          <Eye aria-hidden className="h-3 w-3" />
                          প্রকাশিত
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff aria-hidden className="h-3 w-3" />
                          অফিস
                        </Badge>
                      )}
                      {row.userId ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          aria-label={`${row.nameBn} — অ্যাকাউন্টের লিংক খুলে দিন`}
                          title="অ্যাকাউন্টের লিংক খুলে দিন"
                          disabled={unlinking === row.id}
                          onClick={() => void onUnlink(row)}
                        >
                          {unlinking === row.id ? (
                            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                          ) : (
                            <Link2Off aria-hidden className="h-4 w-4" />
                          )}
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`${row.nameBn} — মুছে ফেলুন`}
                        onClick={() => setDeleting(row)}
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ——— create / edit dialog ——— */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="scrollbar-thin max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap aria-hidden className="h-5 w-5 text-primary" />
              {editing ? `রেকর্ড সম্পাদনা — ${editing.registryNo}` : "নতুন অ্যালামনাই রেকর্ড"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "রেজিস্ট্রি নম্বর অপরিবর্তনীয় — বাকি সব তথ্য হালনাগাদ করা যায়।"
                : "রেজিস্ট্রি নম্বর স্বয়ংক্রিয়ভাবে তৈরি হবে (AL-সাল-ক্রমিক)।"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="alumni-name-bn">নাম (বাংলা) *</Label>
                <Input
                  id="alumni-name-bn"
                  className={inputClass}
                  value={form.nameBn}
                  onChange={(e) => setForm((f) => ({ ...f, nameBn: e.target.value }))}
                  placeholder="মুহাম্মাদ আব্দুল্লাহ"
                />
              </div>
              <div>
                <Label htmlFor="alumni-name-en">নাম (ইংরেজি)</Label>
                <Input
                  id="alumni-name-en"
                  className={inputClass}
                  value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                  placeholder="Muhammad Abdullah"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="alumni-course">কার্যক্রম *</Label>
                <select
                  id="alumni-course"
                  className={inputClass}
                  value={form.courseKey}
                  onChange={(e) => setForm((f) => ({ ...f, courseKey: e.target.value as FormValues["courseKey"] }))}
                >
                  {COURSE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {ALUMNI_COURSE_LABELS[key].bn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="alumni-year">ব্যাচের সাল *</Label>
                <Input
                  id="alumni-year"
                  className={inputClass}
                  inputMode="numeric"
                  value={form.batchYear}
                  onChange={(e) => setForm((f) => ({ ...f, batchYear: e.target.value.replace(/[^0-9]/g, "") }))}
                  placeholder="2026"
                  dir="ltr"
                />
              </div>
              <div>
                <Label htmlFor="alumni-batch-no">ব্যাচ (বাংলা)</Label>
                <Input
                  id="alumni-batch-no"
                  className={inputClass}
                  value={form.batchNoBn}
                  onChange={(e) => setForm((f) => ({ ...f, batchNoBn: e.target.value }))}
                  placeholder="১ম ব্যাচ"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="alumni-occupation">বর্তমান পেশা</Label>
                <Input
                  id="alumni-occupation"
                  className={inputClass}
                  value={form.occupationBn}
                  onChange={(e) => setForm((f) => ({ ...f, occupationBn: e.target.value }))}
                  placeholder="ইমাম ও খতিব"
                />
              </div>
              <div>
                <Label htmlFor="alumni-organization">প্রতিষ্ঠান / জেলা</Label>
                <Input
                  id="alumni-organization"
                  className={inputClass}
                  value={form.organizationBn}
                  onChange={(e) => setForm((f) => ({ ...f, organizationBn: e.target.value }))}
                  placeholder="জামিয়া …, ঢাকা"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="alumni-district">জেলা</Label>
              <Input
                id="alumni-district"
                className={inputClass}
                value={form.districtBn}
                onChange={(e) => setForm((f) => ({ ...f, districtBn: e.target.value }))}
                placeholder="রংপুর"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="alumni-phone">ফোন</Label>
                <Input
                  id="alumni-phone"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  dir="ltr"
                />
              </div>
              <div>
                <Label htmlFor="alumni-email">ইমেইল</Label>
                <Input
                  id="alumni-email"
                  className={inputClass}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="alumni-address">ঠিকানা</Label>
              <Input
                id="alumni-address"
                className={inputClass}
                value={form.addressBn}
                onChange={(e) => setForm((f) => ({ ...f, addressBn: e.target.value }))}
                placeholder="গ্রাম/মহল্লা, ডাকঘর, জেলা"
              />
            </div>

            <label className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3">
              <span>
                <span className="block text-sm font-semibold">ডিরেক্টরিতে প্রকাশ করুন</span>
                <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted-foreground">
                  বন্ধ থাকলে রেকর্ড শুধু অফিস দেখবে — প্রকাশ করলে নাম-ব্যাচ-পেশা প্রকাশ্য ওয়েবসাইটে দেখা যাবে (যোগাযোগ কখনো নয়)।
                </span>
              </span>
              <Switch
                checked={form.isPublished}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isPublished: checked }))}
                aria-label="ডিরেক্টরিতে প্রকাশ"
              />
            </label>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={onSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
              সংরক্ষণ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ——— delete confirm (guarded) ——— */}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>রেকর্ড মুছে ফেলবেন?</DialogTitle>
            <DialogDescription>
              {deleting
                ? deleting.userId
                  ? `${deleting.registryNo} — এই রেকর্ডের সঙ্গে একটি অ্যাকাউন্ট যুক্ত; লিংক খুলে দিতে তালিকার লিংক-আইকনে চাপ দিন।`
                  : `${deleting.registryNo} (${deleting.nameBn}) — এই কাজ ফেরানো যায় না।`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              থাক
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={saving || !!deleting?.userId} className="gap-1.5">
              {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden className="h-4 w-4" />}
              মুছে ফেলুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
