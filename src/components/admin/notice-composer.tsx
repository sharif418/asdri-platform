"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { ADMIN_NOTICE_CATEGORY_LABELS } from "@/components/admin/admin-types";
import type { NoticeFormValues } from "@/components/admin/admin-types";
import { NoticeLivePreview } from "@/components/admin/notice-live-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import type { Language, NoticeCategory, NoticeStatus } from "@/types";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface NoticeComposerProps {
  lang: Language;
  mode: "create" | "edit";
  noticeId?: string;
  initialValues?: NoticeFormValues;
}

function emptyValues(): NoticeFormValues {
  return {
    titleBn: "",
    titleEn: "",
    excerptBn: "",
    excerptEn: "",
    bodyBn: "",
    bodyEn: "",
    category: "general",
    status: "new",
    attachmentUrl: "",
    slug: "",
  };
}

/** Client-side validation mirroring the server zod schemas. */
function validateNotice(values: NoticeFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const titleBn = values.titleBn.trim();
  if (titleBn.length < 4) errors.titleBn = "বাংলা শিরোনাম কমপক্ষে ৪ অক্ষরের";
  else if (titleBn.length > 220) errors.titleBn = "শিরোনাম ২২০ অক্ষরের বেশি হতে পারবে না";

  const titleEn = values.titleEn.trim();
  if (titleEn.length < 4) errors.titleEn = "English title must be at least 4 characters";
  else if (titleEn.length > 220) errors.titleEn = "English title can be at most 220 characters";

  const excerptBn = values.excerptBn.trim();
  if (excerptBn.length < 10) errors.excerptBn = "বাংলা সারসংক্ষেপ কমপক্ষে ১০ অক্ষরের";
  else if (excerptBn.length > 400) errors.excerptBn = "সারসংক্ষেপ ৪০০ অক্ষরের বেশি হতে পারবে না";

  const excerptEn = values.excerptEn.trim();
  if (excerptEn.length < 10) errors.excerptEn = "English excerpt must be at least 10 characters";
  else if (excerptEn.length > 400) errors.excerptEn = "English excerpt can be at most 400 characters";

  if (values.bodyBn.trim().length > 6000) errors.bodyBn = "বিস্তারিত অংশ ৬০০০ অক্ষরের বেশি হতে পারবে না";
  if (values.bodyEn.trim().length > 6000) errors.bodyEn = "Body can be at most 6000 characters";

  if (values.attachmentUrl.trim()) {
    try {
      new URL(values.attachmentUrl.trim());
    } catch {
      errors.attachmentUrl = "সঠিক লিংক দিন (যেমন: https://…)";
    }
  }

  if (values.slug.trim() && !SLUG_RE.test(values.slug.trim())) {
    errors.slug = "slug ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন দিয়ে গঠিত হতে হবে";
  }
  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[12px] font-medium text-destructive">
      {message}
    </p>
  );
}

/** Notice create/edit composer with a Bengali live preview (reused for both modes). */
export function NoticeComposer({ lang, mode, noticeId, initialValues }: NoticeComposerProps) {
  const bn = lang === "bn";
  const router = useRouter();
  const [values, setValues] = useState<NoticeFormValues>(initialValues ?? emptyValues());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof NoticeFormValues>(key: K, next: NoticeFormValues[K]): void {
    setValues((prev) => ({ ...prev, [key]: next }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting) return;

    const errors = validateNotice(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: bn ? "ফর্মের তথ্যগুলো যাচাই করুন" : "Please fix the highlighted fields",
        variant: "destructive",
      });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const isEdit = mode === "edit" && noticeId;
      const res = await fetch(isEdit ? `/api/admin/notices/${noticeId}` : "/api/admin/notices", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload: {
        data?: { message?: string; slug?: string };
        error?: string;
        fields?: Record<string, string>;
      } = await res.json();

      if (!res.ok) {
        if (payload.fields) setFieldErrors(payload.fields);
        toast({ title: payload.error ?? (bn ? "সমস্যা হয়েছে" : "Something went wrong"), variant: "destructive" });
        return;
      }

      toast({
        title:
          payload.data?.message ??
          (isEdit ? "নোটিশ সফলভাবে হালনাগাদ হয়েছে" : "নোটিশ সফলভাবে প্রকাশিত হয়েছে"),
        description: payload.data?.slug ? `/${payload.data.slug}` : undefined,
      });
      router.push("/admin/notices");
      router.refresh();
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error — try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label={bn ? "নোটিশ ফর্ম" : "Notice form"}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      {/* ————— Editor fields ————— */}
      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          {/* Title pair */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="notice-title-bn" className="gap-2">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:text-gold">
                  বাংলা
                </span>
                {bn ? "শিরোনাম *" : "Title (Bengali) *"}
              </Label>
              <Input
                id="notice-title-bn"
                value={values.titleBn}
                onChange={(event) => update("titleBn", event.target.value)}
                maxLength={220}
                aria-invalid={Boolean(fieldErrors.titleBn)}
                aria-describedby={fieldErrors.titleBn ? "notice-title-bn-error" : undefined}
                className="min-h-11"
              />
              <FieldError id="notice-title-bn-error" message={fieldErrors.titleBn} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notice-title-en" className="gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  English
                </span>
                {bn ? "শিরোনাম (ইংরেজি) *" : "Title (English) *"}
              </Label>
              <Input
                id="notice-title-en"
                dir="ltr"
                value={values.titleEn}
                onChange={(event) => update("titleEn", event.target.value)}
                maxLength={220}
                aria-invalid={Boolean(fieldErrors.titleEn)}
                aria-describedby={fieldErrors.titleEn ? "notice-title-en-error" : undefined}
                className="min-h-11"
              />
              <FieldError id="notice-title-en-error" message={fieldErrors.titleEn} />
            </div>
          </div>

          <Separator className="my-5" />

          {/* Excerpt pair */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="notice-excerpt-bn">{bn ? "সারসংক্ষেপ (বাংলা) *" : "Excerpt (Bengali) *"}</Label>
              <Textarea
                id="notice-excerpt-bn"
                value={values.excerptBn}
                onChange={(event) => update("excerptBn", event.target.value)}
                maxLength={400}
                rows={3}
                aria-invalid={Boolean(fieldErrors.excerptBn)}
                aria-describedby={fieldErrors.excerptBn ? "notice-excerpt-bn-error" : undefined}
              />
              <FieldError id="notice-excerpt-bn-error" message={fieldErrors.excerptBn} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notice-excerpt-en">{bn ? "সারসংক্ষেপ (ইংরেজি) *" : "Excerpt (English) *"}</Label>
              <Textarea
                id="notice-excerpt-en"
                dir="ltr"
                value={values.excerptEn}
                onChange={(event) => update("excerptEn", event.target.value)}
                maxLength={400}
                rows={3}
                aria-invalid={Boolean(fieldErrors.excerptEn)}
                aria-describedby={fieldErrors.excerptEn ? "notice-excerpt-en-error" : undefined}
              />
              <FieldError id="notice-excerpt-en-error" message={fieldErrors.excerptEn} />
            </div>
          </div>
        </div>

        {/* Body pair */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-[15px] font-bold">{bn ? "বিস্তারিত বিবরণ" : "Full Body"}</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {bn
              ? "প্রতিটি অনুচ্ছেদ নতুন লাইনে লিখুন — প্রকাশ্য কার্ডে অনুচ্ছেদ অনুযায়ী দেখাবে।"
              : "One paragraph per line — paragraphs render separated on the public card."}
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="notice-body-bn" className="gap-2">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:text-gold">
                  বাংলা
                </span>
                {bn ? "বিস্তারিত (বাংলা)" : "Body (Bengali)"}
              </Label>
              <Textarea
                id="notice-body-bn"
                value={values.bodyBn}
                onChange={(event) => update("bodyBn", event.target.value)}
                maxLength={6000}
                rows={8}
                aria-invalid={Boolean(fieldErrors.bodyBn)}
                aria-describedby={fieldErrors.bodyBn ? "notice-body-bn-error" : undefined}
              />
              <FieldError id="notice-body-bn-error" message={fieldErrors.bodyBn} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notice-body-en" className="gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  English
                </span>
                {bn ? "বিস্তারিত (ইংরেজি)" : "Body (English)"}
              </Label>
              <Textarea
                id="notice-body-en"
                dir="ltr"
                value={values.bodyEn}
                onChange={(event) => update("bodyEn", event.target.value)}
                maxLength={6000}
                rows={8}
                aria-invalid={Boolean(fieldErrors.bodyEn)}
                aria-describedby={fieldErrors.bodyEn ? "notice-body-en-error" : undefined}
              />
              <FieldError id="notice-body-en-error" message={fieldErrors.bodyEn} />
            </div>
          </div>
        </div>

        {/* Category + status + attachment + slug */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-[15px] font-bold">{bn ? "শ্রেণিবিন্যাস ও প্রকাশনা" : "Classification & Publishing"}</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="notice-category">{bn ? "ক্যাটেগরি" : "Category"}</Label>
              <Select value={values.category} onValueChange={(next) => update("category", next as NoticeCategory)}>
                <SelectTrigger id="notice-category" className="min-h-11">
                  <SelectValue placeholder={bn ? "ক্যাটেগরি নির্বাচন করুন" : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ADMIN_NOTICE_CATEGORY_LABELS) as NoticeCategory[]).map((value) => (
                    <SelectItem key={value} value={value} className="min-h-11">
                      {bn ? ADMIN_NOTICE_CATEGORY_LABELS[value].bn : ADMIN_NOTICE_CATEGORY_LABELS[value].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notice-status">{bn ? "স্ট্যাটাস" : "Status"}</Label>
              <Select value={values.status} onValueChange={(next) => update("status", next as NoticeStatus)}>
                <SelectTrigger id="notice-status" className="min-h-11">
                  <SelectValue placeholder={bn ? "স্ট্যাটাস নির্বাচন করুন" : "Select a status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new" className="min-h-11">
                    {bn ? "নতুন" : "New"}
                  </SelectItem>
                  <SelectItem value="active" className="min-h-11">
                    {bn ? "সক্রিয়" : "Active"}
                  </SelectItem>
                  <SelectItem value="closed" className="min-h-11">
                    {bn ? "বন্ধ" : "Closed"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notice-attachment">{bn ? "সংযুক্ত ফাইলের লিংক (ঐচ্ছিক)" : "Attachment URL (optional)"}</Label>
              <Input
                id="notice-attachment"
                dir="ltr"
                type="url"
                value={values.attachmentUrl}
                onChange={(event) => update("attachmentUrl", event.target.value)}
                maxLength={500}
                placeholder="https://…"
                aria-invalid={Boolean(fieldErrors.attachmentUrl)}
                aria-describedby={fieldErrors.attachmentUrl ? "notice-attachment-error" : undefined}
                className="min-h-11"
              />
              <FieldError id="notice-attachment-error" message={fieldErrors.attachmentUrl} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notice-slug">{bn ? "স্লাগ (ঐচ্ছিক)" : "Slug (optional)"}</Label>
              <Input
                id="notice-slug"
                dir="ltr"
                value={values.slug}
                onChange={(event) => update("slug", event.target.value)}
                maxLength={160}
                placeholder="admission-2026-circular"
                aria-invalid={Boolean(fieldErrors.slug)}
                aria-describedby={fieldErrors.slug ? "notice-slug-error" : "notice-slug-hint"}
                className="min-h-11 font-mono text-[13px]"
              />
              <FieldError id="notice-slug-error" message={fieldErrors.slug} />
              <p id="notice-slug-hint" className="text-[11.5px] leading-snug text-muted-foreground">
                {mode === "edit"
                  ? bn
                    ? "খালি রাখলে বর্তমান স্লাগ অপরিবর্তিত থাকবে।"
                    : "Leave empty to keep the current slug."
                  : bn
                    ? "খালি রাখলে ইংরেজি শিরোনাম থেকে স্বয়ংক্রিয়ভাবে তৈরি হবে।"
                    : "Auto-generated from the English title when left empty."}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="min-h-11 gap-2 bg-gold-gradient px-6 font-bold text-gold-foreground hover:opacity-90"
          >
            {submitting ? (
              <>
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                {bn ? "সংরক্ষণ হচ্ছে…" : "Saving…"}
              </>
            ) : (
              <>
                <Save aria-hidden className="h-4 w-4" />
                {mode === "edit" ? (bn ? "পরিবর্তন সংরক্ষণ করুন" : "Save Changes") : bn ? "নোটিশ প্রকাশ করুন" : "Publish Notice"}
              </>
            )}
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-h-11 gap-2 border-primary/30 font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Link href="/admin/notices">
              <ArrowLeft aria-hidden className="h-4 w-4" />
              {bn ? "তালিকায় ফিরে যান" : "Back to list"}
            </Link>
          </Button>
        </div>
      </div>

      {/* ————— Live preview ————— */}
      <aside aria-label={bn ? "লাইভ প্রিভিউ" : "Live preview"} className="min-w-0">
        <NoticeLivePreview values={values} lang={lang} />
      </aside>
    </form>
  );
}
