"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { MediaPicker, type PickedMedia } from "@/components/admin/ui/media-picker";

export interface DownloadFormValues {
  id?: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  categoryBn: string;
  categoryEn: string;
  courseId: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface CourseOption {
  id: string;
  titleBn: string;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Shared create/edit form for download centre resources. */
export function DownloadForm({
  initial,
  initialFile,
  categories,
  courses,
  mode,
}: {
  initial: DownloadFormValues;
  initialFile: PickedMedia | null;
  categories: { bn: string; en: string }[];
  courses: CourseOption[];
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [values, setValues] = useState<DownloadFormValues>(initial);
  const [file, setFile] = useState<PickedMedia | null>(initialFile);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function set<K extends keyof DownloadFormValues>(key: K, value: DownloadFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave() {
    if (saving) return;
    if (values.titleBn.trim().length < 3) {
      toast({ title: "বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে।", variant: "destructive" });
      return;
    }
    if (values.categoryBn.trim().length < 2) {
      toast({ title: "বাংলা ক্যাটাগরি কমপক্ষে ২ অক্ষরের হতে হবে।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titleBn: values.titleBn,
        titleEn: values.titleEn,
        descriptionBn: values.descriptionBn,
        descriptionEn: values.descriptionEn,
        categoryBn: values.categoryBn,
        categoryEn: values.categoryEn,
        courseId: values.courseId || null,
        sortOrder: values.sortOrder,
        isPublished: values.isPublished,
        fileMediaId: file?.id ?? null,
      };
      const res = await fetch(mode === "create" ? "/api/admin/download-resources" : `/api/admin/download-resources/${values.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string>; data?: { id: string } };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? Object.values(json.fields ?? {})[0] ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: mode === "create" ? "ডাউনলোড আইটেম তৈরি হয়েছে" : "সংরক্ষিত হয়েছে" });
      if (mode === "create" && json.data?.id) {
        router.push(`/admin/research/downloads/${json.data.id}`);
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
    if (!window.confirm(`'${values.titleBn}' স্থায়ীভাবে মুছে ফেলা হবে। নিশ্চিত?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/download-resources/${values.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken() },
      });
      if (res.ok) {
        toast({ title: "ডাউনলোড আইটেম মুছে ফেলা হয়েছে" });
        router.push("/admin/research/downloads");
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
              dir={active === "bn" ? "rtl" : "ltr"}
              placeholder={active === "bn" ? "যেমন: ভর্তি ফরম ২০২৬" : "e.g. Admission Form 2026"}
              required
              className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] font-heading outline-none focus:border-primary/50"
            />
          )}
        </BilingualField>

        <BilingualField label="বিবরণ" hint="আইটেমের ছোট বর্ণনা — তালিকায় দেখানো হয়।">
          {(active) => (
            <textarea
              value={active === "bn" ? values.descriptionBn : values.descriptionEn}
              onChange={(e) => set(active === "bn" ? "descriptionBn" : "descriptionEn", e.target.value)}
              rows={3}
              dir={active === "bn" ? "rtl" : "ltr"}
              placeholder={active === "bn" ? "১–২ লাইনের বিবরণ" : "1–2 line description"}
              className="w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          )}
        </BilingualField>

        <BilingualField label="ক্যাটাগরি" required hint="একই ক্যাটাগরির আইটেম একত্রে গ্রুপ হয় — লিস্টের বাংলা নাম দিয়ে মিলিয়ে লিখুন।">
          {(active) => (
            <div>
              <input
                value={active === "bn" ? values.categoryBn : values.categoryEn}
                onChange={(e) => set(active === "bn" ? "categoryBn" : "categoryEn", e.target.value)}
                dir={active === "bn" ? "rtl" : "ltr"}
                list={active === "bn" ? "download-category-bn" : "download-category-en"}
                placeholder={active === "bn" ? "যেমন: ভর্তি ফরম" : "e.g. Admission Forms"}
                required
                className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
              <datalist id="download-category-bn">
                {categories.map((category) => (
                  <option key={category.bn} value={category.bn} />
                ))}
              </datalist>
              <datalist id="download-category-en">
                {categories.map((category) => (
                  <option key={category.en} value={category.en} />
                ))}
              </datalist>
            </div>
          )}
        </BilingualField>
      </div>

      <aside className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm xl:sticky xl:top-20 h-fit">
        <div>
          <label className="text-sm font-semibold">পিডিএফ ফাইল</label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">মিডিয়া লাইব্রেরি থেকে বা সরাসরি আপলোড।</p>
          <div className="mt-1.5">
            <MediaPicker current={file} onSelect={(media) => setFile(media)} kind="DOCUMENT" compact />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">সংশ্লিষ্ট কোর্স (ঐচ্ছিক)</label>
          <select
            value={values.courseId}
            onChange={(e) => set("courseId", e.target.value)}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">— কোর্স নির্বাচন করুন —</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.titleBn}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">কোর্স নির্বাচন করলে আইটেমটি সেই কোর্সের পাতায়ও দেখানো হয়।</p>
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
            <p className="text-[11px] text-muted-foreground">বন্ধ থাকলে ডাউনলোড সেন্টারে দেখাবে না</p>
          </div>
          <Switch checked={values.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label="প্রকাশিত" />
        </div>

        <div className="border-t pt-4">
          <div className="mt-1">
            <LanguageStatus hasBn={values.titleBn.length > 2} hasEn={values.titleEn.length > 2} />
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <Button onClick={onSave} disabled={saving} className="w-full gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "আইটেম তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
          {mode === "edit" && (
            <>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/academics/downloads" target="_blank" className="gap-1.5 text-muted-foreground">
                  ডাউনলোড সেন্টারে দেখুন ↗
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
