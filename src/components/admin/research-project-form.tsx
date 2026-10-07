"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Megaphone, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { sanitizeRichTextPreview } from "@/lib/sanitize";
import { slugifyTitle } from "@/lib/slug";
import { adminConfirm } from "@/components/admin/ui/confirm";

export interface ResearchProjectFormValues {
  id?: string;
  titleBn: string;
  titleEn: string;
  summaryBn: string;
  summaryEn: string;
  progress: number;
  statusBn: string;
  statusEn: string;
  isCallForPapers: boolean;
  deadline: string;
  isPublished: boolean;
  sortOrder: number;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Shared create/edit form for research projects. */
export function ResearchProjectForm({ initial, mode }: { initial: ResearchProjectFormValues; mode: "create" | "edit" }) {
  const router = useRouter();
  const [values, setValues] = useState<ResearchProjectFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Display-only; Bangla-only titles get their slug generated server-side.
  const slug = mode === "create" ? slugifyTitle(values.titleEn) || slugifyTitle(values.titleBn) : values.id ?? "";

  function set<K extends keyof ResearchProjectFormValues>(key: K, value: ResearchProjectFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave() {
    if (saving) return;
    if (values.titleBn.trim().length < 3) {
      toast({ title: "বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titleBn: values.titleBn,
        titleEn: values.titleEn,
        summaryBn: sanitizeRichTextPreview(values.summaryBn),
        summaryEn: sanitizeRichTextPreview(values.summaryEn),
        progress: values.progress,
        statusBn: values.statusBn,
        statusEn: values.statusEn,
        isCallForPapers: values.isCallForPapers,
        deadline: values.deadline,
        isPublished: values.isPublished,
        sortOrder: values.sortOrder,
      };
      const res = await fetch(mode === "create" ? "/api/admin/research-projects" : `/api/admin/research-projects/${values.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string>; data?: { id: string } };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? Object.values(json.fields ?? {})[0] ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: mode === "create" ? "গবেষণা প্রকল্প তৈরি হয়েছে" : "সংরক্ষিত হয়েছে" });
      if (mode === "create" && json.data?.id) {
        router.push(`/admin/research/projects/${json.data.id}`);
      } else {
        router.refresh();
      }
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (deleting || mode !== "edit" || !values.id) return;
    if (!(await adminConfirm({ title: `'${values.titleBn}' স্থায়ীভাবে মুছে ফেলা হবে। নিশ্চিত?` }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/research-projects/${values.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken() },
      });
      if (res.ok) {
        toast({ title: "গবেষণা প্রকল্প মুছে ফেলা হয়েছে" });
        router.push("/admin/research/projects");
      } else {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        toast({ title: json?.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <BilingualField label="শিরোনাম" required>
          {(active) => (
            <input
              value={active === "bn" ? values.titleBn : values.titleEn}
              onChange={(e) => set(active === "bn" ? "titleBn" : "titleEn", e.target.value)}
             
              placeholder={active === "bn" ? "বাংলা শিরোনাম" : "English title"}
              required
              className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] font-heading outline-none focus:border-primary/50"
            />
          )}
        </BilingualField>

        <BilingualField label="সারসংক্ষেপ" hint="প্রকল্পের মূল বিষয়বস্তু — সাধারণ টেক্সট।">
          {(active) => (
            <textarea
              value={active === "bn" ? values.summaryBn : values.summaryEn}
              onChange={(e) => set(active === "bn" ? "summaryBn" : "summaryEn", e.target.value)}
              rows={4}
             
              placeholder={active === "bn" ? "প্রকল্পের লক্ষ্য ও পরিধি…" : "Aim and scope of the project…"}
              className="w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          )}
        </BilingualField>

        <BilingualField label="অবস্থা / পর্যায়" hint="যেমন: চলছে, তথ্য সংগ্রহ, পাণ্ডুলিপি প্রস্তুত।">
          {(active) => (
            <input
              value={active === "bn" ? values.statusBn : values.statusEn}
              onChange={(e) => set(active === "bn" ? "statusBn" : "statusEn", e.target.value)}
             
              placeholder={active === "bn" ? "যেমন: চলছে" : "e.g. Ongoing"}
              className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          )}
        </BilingualField>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">অগ্রগতি</label>
            <span className="font-heading text-lg font-bold text-primary">{values.progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={values.progress}
            onChange={(e) => set("progress", Number.parseInt(e.target.value, 10))}
            aria-label="অগ্রগতি (শতকরা)"
            className="mt-3 w-full accent-primary"
          />
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              value={values.progress}
              onChange={(e) => {
                const next = Number.parseInt(e.target.value, 10);
                set("progress", Number.isNaN(next) ? 0 : Math.min(100, Math.max(0, next)));
              }}
              dir="ltr"
              className="w-24 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary/50"
            />
            <p className="text-[11.5px] text-muted-foreground">০–১০০ শতকরা অগ্রগতি — স্লাইডার বা সংখ্যা যেকোনোটি ব্যবহার করুন।</p>
          </div>
        </div>
      </div>

      <aside className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm xl:sticky xl:top-20 h-fit">
        <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Megaphone aria-hidden className="h-4 w-4 text-gold" />
              কল ফর পেপার্স
            </p>
            <p className="text-[11px] text-muted-foreground">গবেষণা-প্রবন্ধ আহ্বান চলছে</p>
          </div>
          <Switch checked={values.isCallForPapers} onCheckedChange={(v) => set("isCallForPapers", v)} aria-label="কল ফর পেপার্স" />
        </div>

        <div>
          <label className="text-sm font-semibold">ডেডলাইন</label>
          <input
            type="date"
            value={values.deadline}
            onChange={(e) => set("deadline", e.target.value)}
            dir="ltr"
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">কল ফর পেপার্সের শেষ তারিখ (ঐচ্ছিক)।</p>
        </div>

        <div>
          <label className="text-sm font-semibold">ক্রম</label>
          <input
            type="number"
            min={0}
            max={999}
            value={values.sortOrder}
            onChange={(e) => set("sortOrder", Number.parseInt(e.target.value, 10) || 0)}
            dir="ltr"
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
          <div>
            <p className="text-sm font-semibold">প্রকাশিত</p>
            <p className="text-[11px] text-muted-foreground">বন্ধ থাকলে ওয়েবসাইটে দেখাবে না</p>
          </div>
          <Switch checked={values.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label="প্রকাশিত" />
        </div>

        <div className="border-t pt-4">
          <p className="text-[11px] text-muted-foreground" dir="ltr">
            {mode === "create" ? (
              <span>স্লাগ: {slug ? <code className="rounded bg-secondary px-1">{slug}</code> : "স্বয়ংক্রিয়"}</span>
            ) : null}
          </p>
          <div className="mt-1">
            <LanguageStatus hasBn={values.titleBn.length > 2} hasEn={values.titleEn.length > 2} />
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <Button onClick={onSave} disabled={saving} className="w-full gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "প্রকল্প তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
          {mode === "edit" && (
            <>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/research/projects" target="_blank" className="gap-1.5 text-muted-foreground">
                  ওয়েবসাইটে দেখুন ↗
                </Link>
              </Button>
              <Button onClick={onDelete} disabled={deleting} variant="destructive" size="sm" className="w-full gap-1.5">
                {deleting ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : <Trash2 aria-hidden className="h-3.5 w-3.5" />}
                মুছে ফেলুন
              </Button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
