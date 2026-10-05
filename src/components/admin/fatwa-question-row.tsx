"use client";

import { ChevronDown, ChevronUp, Loader2, Save, Send, ShieldQuestion, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/admin/ui/rich-text-editor";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Serializable question row shared with the server page. */
export interface QuestionRowData {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string | null;
  categoryKey: string;
  question: string;
  isPrivate: boolean;
  status: "PENDING" | "ANSWERED" | "PUBLISHED" | "REJECTED";
  answer: string | null;
  note: string | null;
  publishedSlug: string | null;
  createdAt: string;
  answeredByName: string | null;
  answeredAt: string | null;
}

export interface QuestionCategoryOption {
  id: string;
  key: string;
  nameBn: string;
}

const STATUS_LABELS = { PENDING: "অপেক্ষমাণ", ANSWERED: "উত্তরপ্রাপ্ত", PUBLISHED: "প্রকাশিত", REJECTED: "বাতিল" } as const;
const DEFAULT_ANSWERER = "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট";

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** One inbox question — collapsed summary row, expanded answer desk. */
export function FatwaQuestionRow({
  question,
  categoryLabel,
  categories,
}: {
  question: QuestionRowData;
  categoryLabel: string;
  categories: QuestionCategoryOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState(question.answer ?? "");
  const [note, setNote] = useState(question.note ?? "");
  const [showReject, setShowReject] = useState(false);
  const [questionEn, setQuestionEn] = useState("");
  const [answeredBy, setAnsweredBy] = useState(DEFAULT_ANSWERER);
  const [categoryId, setCategoryId] = useState(categories.find((c) => c.key === question.categoryKey)?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  async function onSaveAnswer() {
    if (saving) return;
    if (answer.replace(/<[^>]*>/g, "").trim().length === 0) {
      toast({ title: "উত্তর লিখুন, তারপর সংরক্ষণ করুন।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/fatwa-questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({
          answer,
          ...(question.status === "PENDING" || question.status === "REJECTED" ? { status: "ANSWERED" } : {}),
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string> };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "উত্তর সংরক্ষিত হয়েছে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function onPublish() {
    if (publishing || question.isPrivate) return;
    if (answer.replace(/<[^>]*>/g, "").trim().length === 0) {
      toast({ title: "প্রকাশের আগে উত্তর সংরক্ষণ করুন।", variant: "destructive" });
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/fatwa-questions/${question.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({
          answer,
          questionEn,
          answeredBy,
          ...(categoryId ? { categoryId } : {}),
          isPublished: true,
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { slug: string } };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "প্রকাশ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "ফতোয়া ব্যাংকে প্রকাশিত হয়েছে", description: `স্লাগ: ${json.data?.slug ?? ""}` });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  }

  async function onReject() {
    if (rejecting) return;
    setRejecting(true);
    try {
      const res = await fetch(`/api/admin/fatwa-questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ status: "REJECTED", note: note.trim() || "প্রশ্নটি বিবেচনায় গ্রহণযোগ্য নয়।" }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "বাতিল করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "জিজ্ঞাসাটি বাতিল করা হয়েছে" });
      setShowReject(false);
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/20"
      >
        {open ? <ChevronUp aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <span className="shrink-0 font-mono text-[11px] font-semibold text-muted-foreground" dir="ltr">
          {question.reference}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{question.name}</span>
        <span className="hidden shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold sm:inline">{categoryLabel}</span>
        <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(question.createdAt, "bn")}</span>
        <StatusChip status={question.status} />
        {question.isPrivate && (
          <span
            title="গোপনীয় জিজ্ঞাসা — উত্তর শুধু ইমেইলে যাবে, ফতোয়া ব্যাংকে প্রকাশ করা যাবে না"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10.5px] font-bold text-gold"
          >
            <ShieldQuestion aria-hidden className="h-3 w-3" />
            গোপনীয়
          </span>
        )}
      </button>

      {open && (
        <div className="space-y-5 border-t bg-secondary/10 px-4 py-5 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">জিজ্ঞাসা</p>
              <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-relaxed" dir="auto">
                {question.question}
              </p>
            </div>
            <dl className="space-y-2 rounded-xl border bg-card p-4 text-[12.5px]">
              <MetaRow label="রেফারেন্স" value={question.reference} mono />
              <MetaRow label="নাম" value={question.name} />
              <MetaRow label="ইমেইল" value={question.email} mono />
              {question.phone ? <MetaRow label="ফোন" value={question.phone} mono /> : null}
              <MetaRow label="ক্যাটাগরি" value={categoryLabel} />
              <MetaRow label="জমা" value={formatDate(question.createdAt, "bn")} />
              {question.answeredAt ? (
                <MetaRow label="উত্তরদাতা" value={question.answeredByName ?? "—"} />
              ) : null}
              {question.publishedSlug ? <MetaRow label="ব্যাংক স্লাগ" value={question.publishedSlug} mono /> : null}
              {question.note ? <MetaRow label="নোট" value={question.note} /> : null}
            </dl>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold">উত্তর লিখুন (ফিকহ ও গবেষণা বোর্ড)</p>
            <RichTextEditor value={answer} onChange={setAnswer} placeholder="প্রামাণ্য দলিলসহ উত্তর লিখুন…" dir="rtl" minHeight={200} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onSaveAnswer}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
                  উত্তর সংরক্ষণ করুন
                </button>
                <button
                  type="button"
                  onClick={() => (question.isPrivate ? undefined : onPublish())}
                  disabled={publishing || question.isPrivate}
                  title={question.isPrivate ? "গোপনীয় জিজ্ঞাসা — উত্তর শুধু ইমেইলে যাবে, ব্যাংকে প্রকাশ করা যাবে না" : undefined}
                  className="inline-flex items-center gap-2 rounded-lg border border-gold/60 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {publishing ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Send aria-hidden className="h-4 w-4" />}
                  {question.publishedSlug ? "ব্যাংকে হালনাগাদ করুন" : "প্রকাশ করুন (ফতোয়া ব্যাংকে)"}
                </button>
                {question.status !== "REJECTED" && (
                  <button
                    type="button"
                    onClick={() => setShowReject((s) => !s)}
                    className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <XCircle aria-hidden className="h-4 w-4" />
                    বাতিল
                  </button>
                )}
              </div>
              {question.isPrivate && (
                <p className="text-[11.5px] text-muted-foreground">
                  এই জিজ্ঞাসাটি গোপনীয় — প্রশ্নকর্তা শুধু ইমেইলে ({question.email}) উত্তর পাবেন, ফতোয়া ব্যাংকে প্রকাশ করা যাবে না।
                </p>
              )}
              {showReject && (
                <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <label className="text-[12.5px] font-semibold text-destructive">বাতিলের কারণ (নোট)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="প্রশ্নটি কেন গ্রহণ করা হলো না…"
                    className="w-full resize-y rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-destructive/50"
                  />
                  <button
                    type="button"
                    onClick={onReject}
                    disabled={rejecting}
                    className="inline-flex items-center gap-2 rounded-lg bg-destructive px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                  >
                    {rejecting ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : <XCircle aria-hidden className="h-3.5 w-3.5" />}
                    নিশ্চিত বাতিল
                  </button>
                </div>
              )}
            </div>

            {!question.isPrivate && (
              <div className="space-y-3 rounded-xl border bg-card p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">প্রকাশের তথ্য</p>
                <div>
                  <label className="text-[12px] font-semibold">ইংরেজি প্রশ্ন (ঐচ্ছিক)</label>
                  <input
                    value={questionEn}
                    onChange={(e) => setQuestionEn(e.target.value)}
                    placeholder="English question — slug এ ব্যবহৃত হয়"
                    dir="ltr"
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold">উত্তরদাতা</label>
                  <input
                    value={answeredBy}
                    onChange={(e) => setAnsweredBy(e.target.value)}
                    dir="rtl"
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold">ব্যাংক ক্যাটাগরি</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-[13px]"
                  >
                    <option value="">— নির্বাচন করুন —</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: QuestionRowData["status"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
        status === "PENDING" && "bg-gold/15 text-gold",
        status === "ANSWERED" && "bg-primary/10 text-primary",
        status === "PUBLISHED" && "bg-primary text-primary-foreground",
        status === "REJECTED" && "bg-muted text-muted-foreground",
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 break-words text-right font-medium", mono && "font-mono text-[11.5px]")} dir="auto">
        {value}
      </dd>
    </div>
  );
}
