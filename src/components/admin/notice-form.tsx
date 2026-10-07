"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Pin, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { RichTextEditor } from "@/components/admin/ui/rich-text-editor";
import { sanitizeRichTextPreview } from "@/lib/sanitize";
import { slugifyTitle } from "@/lib/slug";
import { adminConfirm } from "@/components/admin/ui/confirm";
import { GeneralError, fieldId, useFieldErrors } from "@/components/admin/ui/form-errors";

export interface NoticeFormValues {
  id?: string;
  slug?: string;
  titleBn: string;
  titleEn: string;
  excerptBn: string;
  excerptEn: string;
  bodyBn: string;
  bodyEn: string;
  category: "ADMISSION" | "RECRUITMENT" | "ACADEMIC" | "GENERAL";
  status: "NEW" | "ACTIVE" | "CLOSED";
  pinned: boolean;
  isPublished: boolean;
}

const CATEGORY_LABELS = { ADMISSION: "ভর্তি", RECRUITMENT: "নিয়োগ", ACADEMIC: "একাডেমিক", GENERAL: "সাধারণ" } as const;
const STATUS_LABELS = { NEW: "নতুন", ACTIVE: "চলছে", CLOSED: "শেষ" } as const;

/** Shared create/edit form for notices — bilingual, rich-text, live preview. */
export function NoticeForm({ initial, mode }: { initial: NoticeFormValues; mode: "create" | "edit" }) {
  const router = useRouter();
  const [values, setValues] = useState<NoticeFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState(false);
  const fe = useFieldErrors();

  // Server-side generation covers Bangla-only titles (slugify → "").
  const slug = useMemo(() => values.slug ?? slugifyTitle(values.titleEn || values.titleBn), [
    values.slug,
    values.titleEn,
    values.titleBn,
  ]);

  function set<K extends keyof NoticeFormValues>(key: K, value: NoticeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave(publish?: boolean) {
    if (saving) return;
    setSaving(true);
    fe.clear();
    try {
      const payload = {
        ...values,
        ...(publish !== undefined ? { isPublished: publish } : {}),
        bodyBn: sanitizeRichTextPreview(values.bodyBn),
        bodyEn: sanitizeRichTextPreview(values.bodyEn),
        // Only send a slug the API can accept (≥3 chars); empty → server generates.
        slug: mode === "create" && slug.length >= 3 ? slug : undefined,
      };
      const res = await fetch(mode === "create" ? "/api/admin/notices" : `/api/admin/notices/${values.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "",
        },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string>; data?: { slug: string } };
      if (!res.ok || !json.ok) {
        const summary = fe.setFromResponse(json) ?? "সংরক্ষণ করা যায়নি";
        toast({ title: summary, variant: "destructive" });
        return;
      }
      toast({ title: mode === "create" ? "নোটিশ তৈরি হয়েছে" : "সংরক্ষিত হয়েছে" });
      if (mode === "create" && json.data?.slug) {
        router.push(`/admin/notices/${json.data.slug}`);
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
    if (!(await adminConfirm({ title: `'${values.titleBn}' নোটিশটি স্থায়ীভাবে মুছে ফেলা হবে। নিশ্চিত?` }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/notices/${values.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "" },
      });
      if (res.ok) {
        toast({ title: "নোটিশ মুছে ফেলা হয়েছে" });
        router.push("/admin/notices");
      } else {
        toast({ title: "মুছে ফেলা যায়নি", variant: "destructive" });
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <GeneralError message={fe.general} />
        <BilingualField label="শিরোনাম" required hint="বাংলা শিরোনাম বাধ্যতামূলক; ইংরেজি খালি রাখলে বাংলাটিই দুই ভাষায় দেখানো হবে।">
          {(active) => (
            <>
              {active === "bn" ? (
                <>
                  <input
                    id={fieldId("titleBn")}
                    value={values.titleBn}
                    onChange={(e) => set("titleBn", e.target.value)}
                    placeholder="বাংলা শিরোনাম লিখুন"
                    aria-invalid={fe.errors.titleBn ? true : undefined}
                    className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] font-heading outline-none focus:border-primary/50"
                    required
                  />
                  <fe.ErrorText name="titleBn" />
                </>
              ) : (
                <>
                  <input
                    id={fieldId("titleEn")}
                    value={values.titleEn}
                    onChange={(e) => set("titleEn", e.target.value)}
                    placeholder="English title"
                    aria-invalid={fe.errors.titleEn ? true : undefined}
                    className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] outline-none focus:border-primary/50"
                  />
                  <fe.ErrorText name="titleEn" />
                </>
              )}
            </>
          )}
        </BilingualField>

        <BilingualField label="সংক্ষিপ্ত বিবরণ (এক্সার্পট)" hint="নোটিশ কার্ডে ও সার্চে দেখানো হয়।">
          {(active) =>
            active === "bn" ? (
              <textarea
                value={values.excerptBn}
                onChange={(e) => set("excerptBn", e.target.value)}
                rows={2}
                placeholder="২–৩ লাইনের সারসংক্ষেপ"
                className="w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            ) : (
              <textarea
                value={values.excerptEn}
                onChange={(e) => set("excerptEn", e.target.value)}
                rows={2}
                placeholder="2–3 line summary"
                className="w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            )
          }
        </BilingualField>

        <BilingualField label="মূল বিজ্ঞপ্তি">
          {(active) =>
            active === "bn" ? (
              <RichTextEditor
                value={values.bodyBn}
                onChange={(html) => set("bodyBn", html)}
                label="বিস্তারিত বিজ্ঞপ্তি"
                placeholder="বিস্তারিত বিজ্ঞপ্তি…"
              />
            ) : (
              <RichTextEditor value={values.bodyEn} onChange={(html) => set("bodyEn", html)} label="Full notice body" placeholder="Full notice body…" />
            )
          }
        </BilingualField>

        {preview && (
          <div className="rounded-lg border bg-parchment/40 p-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">প্রিভিউ (বাংলা)</p>
            <h3 className="font-heading text-xl font-bold">{values.titleBn || "শিরোনাম…"}</h3>
            <div
              className="prose-islamic mt-3 text-sm"
              dangerouslySetInnerHTML={{ __html: sanitizeRichTextPreview(values.bodyBn) || "<p>বিজ্ঞপ্তির মূল অংশ খালি।</p>" }}
            />
          </div>
        )}
      </div>

      <aside className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm xl:sticky xl:top-20 h-fit">
        <div>
          <label htmlFor={fieldId("category")} className="text-sm font-semibold">ক্যাটাগরি</label>
          <select
            id={fieldId("category")}
            value={values.category}
            onChange={(e) => set("category", e.target.value as NoticeFormValues["category"])}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <fe.ErrorText name="category" />
        </div>

        <div>
          <label htmlFor={fieldId("status")} className="text-sm font-semibold">অবস্থা</label>
          <select
            id={fieldId("status")}
            value={values.status}
            onChange={(e) => set("status", e.target.value as NoticeFormValues["status"])}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Pin aria-hidden className="h-3.5 w-3.5 text-gold" />
              পিন করা
            </p>
            <p className="text-[11px] text-muted-foreground">নোটিশ বোর্ডের একেবারে উপরে থাকবে</p>
          </div>
          <Switch checked={values.pinned} onCheckedChange={(v) => set("pinned", v)} aria-label="পিন করা" />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
          <div>
            <p className="text-sm font-semibold">প্রকাশিত</p>
            <p className="text-[11px] text-muted-foreground">বন্ধ থাকলে শুধু ড্রাফট থাকবে</p>
          </div>
          <Switch checked={values.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label="প্রকাশিত" />
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
          <Button onClick={() => onSave()} disabled={saving} className="w-full gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "নোটিশ তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
          <Button onClick={() => onSave(values.isPublished ? undefined : true)} disabled={saving} variant="outline" className="w-full gap-2">
            <Eye aria-hidden className="h-4 w-4" />
            প্রকাশ করুন
          </Button>
          <Button onClick={() => setPreview((p) => !p)} variant="ghost" size="sm" className="w-full gap-1.5 text-muted-foreground">
            {preview ? <EyeOff aria-hidden className="h-3.5 w-3.5" /> : <Eye aria-hidden className="h-3.5 w-3.5" />}
            {preview ? "প্রিভিউ বন্ধ" : "প্রিভিউ দেখুন"}
          </Button>
          {mode === "edit" && (
            <>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href={`/notices?notice=${slug}`} target="_blank" className="gap-1.5 text-muted-foreground">
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
