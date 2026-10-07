"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { MediaPicker, type PickedMedia } from "@/components/admin/ui/media-picker";
import { slugifyTitle } from "@/lib/slug";
import { adminConfirm } from "@/components/admin/ui/confirm";
import { GeneralError, fieldId, useFieldErrors } from "@/components/admin/ui/form-errors";

export interface AlbumFormValues {
  id?: string;
  slug?: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  isPublished: boolean;
  sortOrder: number;
  cover: PickedMedia | null;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Album fields form — title/description/cover/publish (images managed separately). */
export function AlbumForm({ initial, mode }: { initial: AlbumFormValues; mode: "create" | "edit" }) {
  const router = useRouter();
  const [values, setValues] = useState<AlbumFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fe = useFieldErrors();

  // Server-side generation covers Bangla-only titles (slugify → "").
  const slug = useMemo(
    () => values.slug ?? slugifyTitle(values.titleEn || values.titleBn),
    [values.slug, values.titleEn, values.titleBn],
  );

  function set<K extends keyof AlbumFormValues>(key: K, value: AlbumFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave() {
    if (saving) return;
    setSaving(true);
    fe.clear();
    try {
      const payload = {
        titleBn: values.titleBn,
        titleEn: values.titleEn,
        descriptionBn: values.descriptionBn,
        descriptionEn: values.descriptionEn,
        isPublished: values.isPublished,
        sortOrder: values.sortOrder,
        coverMediaId: values.cover?.id ?? null,
        // Only send a slug the API can accept (≥3 chars); empty → server generates.
        ...(mode === "create" && slug.length >= 3 ? { slug } : {}),
      };
      const res = await fetch(mode === "create" ? "/api/admin/albums" : `/api/admin/albums/${values.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string>; data?: { slug: string } };
      if (!res.ok || !json.ok) {
        const summary = fe.setFromResponse(json) ?? "সংরক্ষণ করা যায়নি";
        toast({ title: summary, variant: "destructive" });
        return;
      }
      toast({ title: mode === "create" ? "অ্যালবাম তৈরি হয়েছে" : "সংরক্ষিত হয়েছে" });
      if (mode === "create" && json.data?.slug) {
        router.push(`/admin/gallery/${json.data.slug}`);
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
    if (!(await adminConfirm({ title: `'${values.titleBn}' অ্যালবামটি এর সব ছবিসহ মুছে ফেলা হবে। নিশ্চিত?` }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/albums/${values.id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken() } });
      if (res.ok) {
        toast({ title: "অ্যালবাম মুছে ফেলা হয়েছে" });
        router.push("/admin/gallery");
      } else {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        toast({ title: json?.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <GeneralError message={fe.general} />
          <BilingualField label="অ্যালবামের শিরোনাম" required>
            {(active) =>
              active === "bn" ? (
                <>
                  <input
                    id={fieldId("titleBn")}
                    value={values.titleBn}
                    onChange={(e) => set("titleBn", e.target.value)}
                    placeholder="বাংলা শিরোনাম"
                    aria-invalid={fe.errors.titleBn ? true : undefined}
                    required
                    className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] font-heading outline-none focus:border-primary/50"
                  />
                  <fe.ErrorText name="titleBn" />
                </>
              ) : (
                <>
                  <input
                    id={fieldId("titleEn")}
                    value={values.titleEn}
                    onChange={(e) => set("titleEn", e.target.value)}
                    placeholder="Album title"
                    aria-invalid={fe.errors.titleEn ? true : undefined}
                    className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] outline-none focus:border-primary/50"
                  />
                  <fe.ErrorText name="titleEn" />
                </>
              )
            }
          </BilingualField>

          <BilingualField label="বিবরণ" hint="গ্যালারি পাতায় অ্যালবামের নিচে দেখানো হয়।">
            {(active) =>
              active === "bn" ? (
                <textarea
                  value={values.descriptionBn}
                  onChange={(e) => set("descriptionBn", e.target.value)}
                  rows={3}
                  placeholder="১–২ লাইনের বিবরণ"
                  className="w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              ) : (
                <textarea
                  value={values.descriptionEn}
                  onChange={(e) => set("descriptionEn", e.target.value)}
                  rows={3}
                  placeholder="1–2 line description"
                  className="w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              )
            }
          </BilingualField>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">কভার ছবি</label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">তালিকায় দেখানো হয় (খালি হলে প্রথম ছবি)।</p>
            <div className="mt-2">
              <MediaPicker current={values.cover} onSelect={(media) => set("cover", media)} label="কভার নির্বাচন" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
            <div>
              <p className="text-sm font-semibold">প্রকাশিত</p>
              <p className="text-[11px] text-muted-foreground">বন্ধ থাকলে গ্যালারিতে দেখাবে না</p>
            </div>
            <Switch checked={values.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label="প্রকাশিত" />
          </div>

          <div>
            <label htmlFor={fieldId("sortOrder")} className="text-sm font-semibold">ক্রম</label>
            <input
              id={fieldId("sortOrder")}
              type="number"
              min={0}
              max={999}
              value={values.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
              aria-invalid={fe.errors.sortOrder ? true : undefined}
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <fe.ErrorText name="sortOrder" />
          </div>

          <div className="border-t pt-4">
            <p className="text-[11px] text-muted-foreground">
              স্লাগ: <code className="rounded bg-secondary px-1">{slug || "স্বয়ংক্রিয়"}</code>
            </p>
            <div className="mt-1">
              <LanguageStatus hasBn={values.titleBn.length > 2} hasEn={values.titleEn.length > 2} />
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Button onClick={() => void onSave()} disabled={saving} className="w-full gap-2 font-semibold">
              {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
              {mode === "create" ? "অ্যালবাম তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
            </Button>
            {mode === "edit" && (
              <>
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link href="/media/gallery" target="_blank" className="gap-1.5 text-muted-foreground">
                    ওয়েবসাইটে দেখুন ↗
                  </Link>
                </Button>
                <Button onClick={() => void onDelete()} disabled={deleting} variant="destructive" size="sm" className="w-full gap-1.5">
                  {deleting ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : <Trash2 aria-hidden className="h-3.5 w-3.5" />}
                  অ্যালবাম মুছে ফেলুন
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
