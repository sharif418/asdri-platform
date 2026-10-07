"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { RichTextEditor } from "@/components/admin/ui/rich-text-editor";
import { MediaPicker, type PickedMedia } from "@/components/admin/ui/media-picker";
import { PreviewLinkButton } from "@/components/admin/preview-link-button";
import { sanitizeRichTextPreview } from "@/lib/sanitize";
import { slugifyTitle } from "@/lib/slug";
import { toBnDigits } from "@/lib/format";
import { adminConfirm } from "@/components/admin/ui/confirm";
import { GeneralError, fieldId, useFieldErrors } from "@/components/admin/ui/form-errors";

export interface PostFormValues {
  id?: string;
  slug?: string;
  titleBn: string;
  titleEn: string;
  excerptBn: string;
  excerptEn: string;
  bodyBn: string;
  bodyEn: string;
  kind: "ARTICLE" | "CLARIFICATION" | "NEWS";
  categoryId: string;
  authorId: string;
  isPublished: boolean;
  publishedAt: string; // datetime-local value
  cover: PickedMedia | null;
}

export interface CategoryOption {
  id: string;
  nameBn: string;
}

export interface AuthorOption {
  id: string;
  nameBn: string;
  /** খেতাব / পদবি — appended to the option label to disambiguate the
   *  several same-named teachers (round 4 M14), e.g. "শায়খ আহমাদুল্লাহ (চেয়ারম্যান)". */
  titleBn?: string | null;
  /** Team name fallback when the person has no খেতাব. */
  teamNameBn?: string | null;
}

/** Option label with the designation in parentheses when known (M14). */
function authorOptionLabel(author: AuthorOption): string {
  const tag = author.titleBn?.trim() || author.teamNameBn?.trim() || "";
  return tag ? `${author.nameBn} (${tag})` : author.nameBn;
}

const KIND_LABELS = { ARTICLE: "আর্টিকল", CLARIFICATION: "সংশয় নিরসন", NEWS: "খবর / ইভেন্ট" } as const;

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Live Bangla reading-time estimate (words / 200). */
function estimateMinutes(bodyBn: string): number {
  const words = bodyBn.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Shared create/edit form for blog posts, articles & news. */
export function PostForm({
  initial,
  categories,
  authors,
  mode,
}: {
  initial: PostFormValues;
  categories: CategoryOption[];
  authors: AuthorOption[];
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [values, setValues] = useState<PostFormValues>(initial);
  const [cats, setCats] = useState<CategoryOption[]>(categories);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatBn, setNewCatBn] = useState("");
  const [newCatEn, setNewCatEn] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const fe = useFieldErrors();

  // Server-side generation covers Bangla-only titles (slugify → "").
  const slug = useMemo(
    () => values.slug ?? slugifyTitle(values.titleEn || values.titleBn),
    [values.slug, values.titleEn, values.titleBn],
  );
  const minutes = useMemo(() => estimateMinutes(values.bodyBn), [values.bodyBn]);

  function set<K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function createCategory() {
    if (creatingCat || !newCatBn.trim()) return;
    setCreatingCat(true);
    try {
      const res = await fetch("/api/admin/post-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ nameBn: newCatBn.trim(), nameEn: newCatEn.trim() }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { id: string; nameBn: string } };
      if (!res.ok || !json.ok || !json.data) {
        toast({ title: json.error ?? "ক্যাটাগরি তৈরি করা যায়নি", variant: "destructive" });
        return;
      }
      setCats((list) => [...list, json.data!]);
      set("categoryId", json.data.id);
      setNewCatBn("");
      setNewCatEn("");
      setNewCatOpen(false);
      toast({ title: "ক্যাটাগরি তৈরি হয়েছে" });
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setCreatingCat(false);
    }
  }

  async function onSave() {
    if (saving) return;
    setSaving(true);
    fe.clear();
    try {
      const payload = {
        titleBn: values.titleBn,
        titleEn: values.titleEn,
        excerptBn: values.excerptBn,
        excerptEn: values.excerptEn,
        bodyBn: sanitizeRichTextPreview(values.bodyBn),
        bodyEn: sanitizeRichTextPreview(values.bodyEn),
        kind: values.kind,
        categoryId: values.categoryId || null,
        authorId: values.authorId || null,
        coverMediaId: values.cover?.id ?? null,
        isPublished: values.isPublished,
        ...(values.publishedAt ? { publishedAt: new Date(values.publishedAt).toISOString() } : {}),
        // Only send a slug the API can accept (≥3 chars); empty → server generates.
        ...(mode === "create" && slug.length >= 3 ? { slug } : {}),
      };
      const res = await fetch(mode === "create" ? "/api/admin/posts" : `/api/admin/posts/${values.id}`, {
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
      toast({ title: mode === "create" ? "পোস্ট তৈরি হয়েছে" : "সংরক্ষিত হয়েছে" });
      if (mode === "create" && json.data?.slug) {
        router.push(`/admin/blog/${json.data.slug}`);
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
    if (!(await adminConfirm({ title: `'${values.titleBn}' পোস্টটি স্থায়ীভাবে মুছে ফেলা হবে। নিশ্চিত?` }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/posts/${values.id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken() } });
      if (res.ok) {
        toast({ title: "পোস্ট মুছে ফেলা হয়েছে" });
        router.push("/admin/blog");
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
        <GeneralError message={fe.general} />
        <BilingualField label="শিরোনাম" required>
          {(active) =>
            active === "bn" ? (
              <>
                <input
                  id={fieldId("titleBn")}
                  value={values.titleBn}
                  onChange={(e) => set("titleBn", e.target.value)}
                  placeholder="বাংলা শিরোনাম লিখুন"
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
                  placeholder="English title"
                  aria-invalid={fe.errors.titleEn ? true : undefined}
                  className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] outline-none focus:border-primary/50"
                />
                <fe.ErrorText name="titleEn" />
              </>
            )
          }
        </BilingualField>

        <BilingualField label="সংক্ষিপ্ত বিবরণ (এক্সার্পট)" hint="কার্ড, সার্চ ও সোশ্যাল শেয়ারে দেখানো হয়।">
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

        <BilingualField label="মূল লেখা">
          {(active) =>
            active === "bn" ? (
              <RichTextEditor value={values.bodyBn} onChange={(html) => set("bodyBn", html)} label="নিবন্ধের মূল অংশ" placeholder="আর্টিকলের মূল অংশ…" />
            ) : (
              <RichTextEditor value={values.bodyEn} onChange={(html) => set("bodyEn", html)} label="Article body" placeholder="Full article body…" />
            )
          }
        </BilingualField>
      </div>

      <aside className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm xl:sticky xl:top-20 h-fit">
        <div>
          <label htmlFor={fieldId("kind")} className="text-sm font-semibold">ধরন</label>
          <select
            id={fieldId("kind")}
            value={values.kind}
            onChange={(e) => set("kind", e.target.value as PostFormValues["kind"])}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {Object.entries(KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <fe.ErrorText name="kind" />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={fieldId("categoryId")} className="text-sm font-semibold">ক্যাটাগরি</label>
            <button
              type="button"
              onClick={() => setNewCatOpen((o) => !o)}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary hover:underline"
            >
              <Plus aria-hidden className="h-3 w-3" />
              নতুন
            </button>
          </div>
          <select
            id={fieldId("categoryId")}
            value={values.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            aria-invalid={fe.errors.categoryId ? true : undefined}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">— ক্যাটাগরি নেই —</option>
            {cats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameBn}
              </option>
            ))}
          </select>
          <fe.ErrorText name="categoryId" />
          {newCatOpen && (
            <div className="mt-2 space-y-1.5 rounded-lg border bg-background/60 p-2.5">
              <input
                value={newCatBn}
                onChange={(e) => setNewCatBn(e.target.value)}
                placeholder="ক্যাটাগরির নাম (বাংলা)"
                className="w-full rounded-lg border bg-card px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary/50"
              />
              <input
                value={newCatEn}
                onChange={(e) => setNewCatEn(e.target.value)}
                placeholder="Category name (English)"
                className="w-full rounded-lg border bg-card px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={() => void createCategory()}
                disabled={creatingCat || !newCatBn.trim()}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {creatingCat ? <Loader2 aria-hidden className="h-3 w-3 animate-spin" /> : <Plus aria-hidden className="h-3 w-3" />}
                ক্যাটাগরি তৈরি করুন
              </button>
            </div>
          )}
        </div>

        <div>
          <label htmlFor={fieldId("authorId")} className="text-sm font-semibold">লেখক</label>
          <select
            id={fieldId("authorId")}
            value={values.authorId}
            onChange={(e) => set("authorId", e.target.value)}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">— লেখক নির্বাচন করুন —</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {authorOptionLabel(author)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">কভার ছবি</label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">মিডিয়া লাইব্রেরি থেকে বা সরাসরি আপলোড।</p>
          <div className="mt-2">
            <MediaPicker current={values.cover} onSelect={(media) => set("cover", media)} />
          </div>
        </div>

        <div>
          <label htmlFor={fieldId("publishedAt")} className="text-sm font-semibold">প্রকাশের সময়</label>
          <input
            id={fieldId("publishedAt")}
            type="datetime-local"
            value={values.publishedAt}
            onChange={(e) => set("publishedAt", e.target.value)}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
          <div>
            <p className="text-sm font-semibold">প্রকাশিত</p>
            <p className="text-[11px] text-muted-foreground">বন্ধ থাকলে শুধু ড্রাফট থাকবে</p>
          </div>
          <Switch checked={values.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label="প্রকাশিত" />
        </div>

        <div className="border-t pt-4">
          <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <Clock aria-hidden className="h-3 w-3" />
            পড়ার সময় (আনুমানিক): {toBnDigits(minutes)} মিনিট — বাংলা লেখা অনুযায়ী স্বয়ংক্রিয়
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            স্লাগ: <code className="rounded bg-secondary px-1">{slug || "স্বয়ংক্রিয়"}</code>
          </p>
          <div className="mt-1">
            <LanguageStatus hasBn={values.titleBn.length > 2} hasEn={values.titleEn.length > 2} />
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <Button onClick={() => void onSave()} disabled={saving} className="w-full gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "পোস্ট তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
          {mode === "edit" && values.id && (
            <div className="space-y-1">
              <PreviewLinkButton entity="Post" entityId={values.id} />
              <p className="text-[11px] leading-snug text-muted-foreground">
                ড্রাফটসহ — প্রকাশের আগে যে কাউকে পড়ার সুযোগ দিতে শেয়ারযোগ্য লিংক (২৪ ঘণ্টা বৈধ)।
              </p>
            </div>
          )}
          {mode === "edit" && (
            <>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href={`/media/blog/${slug}`} target="_blank" className="gap-1.5 text-muted-foreground">
                  ওয়েবসাইটে দেখুন ↗
                </Link>
              </Button>
              <Button onClick={() => void onDelete()} disabled={deleting} variant="destructive" size="sm" className="w-full gap-1.5">
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
