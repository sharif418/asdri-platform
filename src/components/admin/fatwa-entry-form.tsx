"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { RichTextEditor } from "@/components/admin/ui/rich-text-editor";
import { sanitizeRichTextPreview } from "@/lib/sanitize";
import { slugifyTitle } from "@/lib/slug";
import { adminConfirm } from "@/components/admin/ui/confirm";

export interface FatwaEntryFormValues {
  id?: string;
  slug?: string;
  questionBn: string;
  questionEn: string;
  answerBn: string;
  answerEn: string;
  answeredBy: string;
  categoryId: string;
  isPublished: boolean;
}

export interface FatwaCategoryOption {
  id: string;
  nameBn: string;
}

const DEFAULT_ANSWERER = "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট";

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Shared create/edit form for fatwa bank entries — bilingual, rich-text answer. */
export function FatwaEntryForm({
  initial,
  categories,
  mode,
}: {
  initial: FatwaEntryFormValues;
  categories: FatwaCategoryOption[];
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [values, setValues] = useState<FatwaEntryFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const slug = useMemo(
    () => values.slug ?? (slugifyTitle(values.questionEn) || slugifyTitle(values.questionBn) || "fatwa"),
    [values.slug, values.questionEn, values.questionBn],
  );

  function set<K extends keyof FatwaEntryFormValues>(key: K, value: FatwaEntryFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave() {
    if (saving) return;
    if (values.questionBn.trim().length < 10) {
      toast({ title: "বাংলা প্রশ্ন কমপক্ষে ১০ অক্ষরের হতে হবে।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        questionBn: values.questionBn,
        questionEn: values.questionEn,
        answerBn: sanitizeRichTextPreview(values.answerBn),
        answerEn: sanitizeRichTextPreview(values.answerEn),
        answeredBy: values.answeredBy.trim() || DEFAULT_ANSWERER,
        categoryId: values.categoryId || null,
        isPublished: values.isPublished,
        ...(mode === "create" ? { slug } : {}),
      };
      const res = await fetch(mode === "create" ? "/api/admin/fatwa-entries" : `/api/admin/fatwa-entries/${values.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string>; data?: { slug: string; id: string } };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? Object.values(json.fields ?? {})[0] ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: mode === "create" ? "ফতোয়া তৈরি হয়েছে" : "সংরক্ষিত হয়েছে" });
      if (mode === "create" && json.data?.id) {
        router.push(`/admin/fatwa/entries/${json.data.id}`);
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
    if (!(await adminConfirm({ title: "ফতোয়াটি স্থায়ীভাবে মুছে ফেলা হবে (ব্যাংক থেকেই সরে যাবে)। নিশ্চিত?" }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/fatwa-entries/${values.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken() },
      });
      if (res.ok) {
        toast({ title: "ফতোয়া মুছে ফেলা হয়েছে" });
        router.push("/admin/fatwa/entries");
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
        <BilingualField label="প্রশ্ন" required hint="জিজ্ঞাসার মূল বিষয় — বাংলা বাধ্যতামূলক, ইংরেজি ঐচ্ছিক।">
          {(active) => (
            <>
              {active === "bn" ? (
                <textarea
                  value={values.questionBn}
                  onChange={(e) => set("questionBn", e.target.value)}
                  rows={3}
                  placeholder="বাংলায় প্রশ্নটি লিখুন"
                  required
                  className="w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-[15px] font-heading outline-none focus:border-primary/50"
                />
              ) : (
                <textarea
                  value={values.questionEn}
                  onChange={(e) => set("questionEn", e.target.value)}
                  rows={3}
                  placeholder="English question"
                  dir="ltr"
                  className="w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-[15px] outline-none focus:border-primary/50"
                />
              )}
            </>
          )}
        </BilingualField>

        <BilingualField label="উত্তর (ফতোয়া)" hint="প্রামাণ্য দলিলসহ গবেষণা বোর্ডের উত্তর — রিচ টেক্সট।">
          {(active) =>
            active === "bn" ? (
              <RichTextEditor value={values.answerBn} onChange={(html) => set("answerBn", html)} placeholder="উত্তর লিখুন…" minHeight={220} />
            ) : (
              <RichTextEditor value={values.answerEn} onChange={(html) => set("answerEn", html)} placeholder="Write the answer…" minHeight={220} />
            )
          }
        </BilingualField>
      </div>

      <aside className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm xl:sticky xl:top-20 h-fit">
        <div>
          <label className="text-sm font-semibold">ক্যাটাগরি</label>
          <select
            value={values.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">— ক্যাটাগরিহীন —</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nameBn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">উত্তরদাতা</label>
          <input
            value={values.answeredBy}
            onChange={(e) => set("answeredBy", e.target.value)}
            placeholder="যেমন: গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট"
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
          <div>
            <p className="text-sm font-semibold">প্রকাশিত</p>
            <p className="text-[11px] text-muted-foreground">বন্ধ থাকলে ব্যাংকে দেখাবে না</p>
          </div>
          <Switch checked={values.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label="প্রকাশিত" />
        </div>

        <div className="border-t pt-4">
          <p className="text-[11px] text-muted-foreground">
            স্লাগ: <code className="rounded bg-secondary px-1" dir="ltr">{slug}</code>
          </p>
          <div className="mt-1">
            <LanguageStatus hasBn={values.questionBn.length > 2} hasEn={values.questionEn.length > 2} />
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <Button onClick={onSave} disabled={saving} className="w-full gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "ফতোয়া তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
          {mode === "edit" && (
            <>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/research/fatwa" target="_blank" className="gap-1.5 text-muted-foreground">
                  ফতোয়া ব্যাংকে দেখুন ↗
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
