"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus, Save } from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";
import { toast } from "@/hooks/use-toast";
import { APPLICATION_STATUS_META, OFFICER_STATUSES } from "@/lib/admission-labels";
import { cn } from "@/lib/utils";

const NEXT_HINTS: Partial<Record<ApplicationStatus, string>> = {
  SUBMITTED: "নতুন আবেদন — সাধারণত প্রথম ধাপ ‘যাচাই চলছে’ দিয়ে শুরু হয়।",
  UNDER_REVIEW: "যাচাই শেষে শর্টলিস্ট করুন — আবেদনকারী আসন ও পরীক্ষার তারিখ দেখতে পাবেন।",
  SHORTLISTED: "পরীক্ষার তারিখ নির্ধারিত করলে শর্টলিস্টকৃত আবেদনকারীরা তা অ্যাকাউন্টে দেখবেন।",
  EXAM_SCHEDULED: "পরীক্ষা নেওয়া হলে ফলাফলসহ ‘পরীক্ষা সম্পন্ন’ ধাপে নিন।",
  EXAM_TAKEN: "লিখিত পরীক্ষার পর মৌখিক পরীক্ষার ডাক দিন।",
  INTERVIEW: "মৌখিক পরীক্ষার পর চূড়ান্ত সিদ্ধান্ত — ভর্তি নিশ্চিত বা অপেক্ষমাণ তালিকা।",
  ADMITTED: "আবেদনকারীর ভর্তি নিশ্চিত — এই সিটটি আসন হিসাবে গণনা হয়।",
  WAITLISTED: "অপেক্ষমাণ তালিকা — আসন খালি হলে ভর্তি নিশ্চিত করা যায়।",
  REJECTED: "আবেদনটি নির্বাচিত হয়নি — আর স্ট্যাটাস বদলানো প্রয়োজন নেই।",
  DRAFT: "আবেদনটি এখনো জমা হয়নি।",
};

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Officer's action desk — status transition + note, or a note-only event. */
export function ApplicationOfficerPanel({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<ApplicationStatus>(OFFICER_STATUSES[0]);
  const [note, setNote] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [examScore, setExamScore] = useState("");
  const [vivaScore, setVivaScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [noting, setNoting] = useState(false);

  async function patch(payload: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/admin/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
      body: JSON.stringify(payload),
    });
    return readOk(res);
  }

  async function postNote(payload: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/admin/applications/${applicationId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
      body: JSON.stringify(payload),
    });
    return readOk(res);
  }

  async function readOk(res: Response): Promise<boolean> {
    const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; fields?: Record<string, string> } | null;
    if (!res.ok || !json?.ok) {
      const firstField = json?.fields ? Object.values(json.fields)[0] : null;
      toast({ title: firstField ?? json?.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
      return false;
    }
    return true;
  }

  async function onStatusChange() {
    if (saving) return;
    setSaving(true);
    try {
      const exam = examScore.trim() === "" ? null : Number(examScore);
      const viva = vivaScore.trim() === "" ? null : Number(vivaScore);
      const ok = await patch({
        status: nextStatus,
        note: note.trim(),
        ...(exam !== null && Number.isFinite(exam) ? { examScore: exam } : {}),
        ...(viva !== null && Number.isFinite(viva) ? { vivaScore: viva } : {}),
      });
      if (ok) {
        toast({ title: `স্ট্যাটাস বদলেছে — ${APPLICATION_STATUS_META[nextStatus]?.label ?? nextStatus}` });
        setNote("");
        setExamScore("");
        setVivaScore("");
        router.refresh();
      }
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function onNoteOnly() {
    if (noting) return;
    if (note.trim().length === 0) {
      toast({ title: "মন্তব্য লিখুন।", variant: "destructive" });
      return;
    }
    setNoting(true);
    try {
      // Note-only events work at ANY status (unlike the status PATCH).
      const ok = await postNote({ note: note.trim(), ...(reviewNote.trim() ? { reviewNote: reviewNote.trim() } : {}) });
      if (ok) {
        toast({ title: "মন্তব্য যোগ হয়েছে — প্রক্রিয়ার ধাপে দেখা যাবে" });
        setNote("");
        router.refresh();
      }
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setNoting(false);
    }
  }

  const inputClass = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50";

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquarePlus aria-hidden className="h-4 w-4 text-primary" />
        অফিসার অ্যাকশন
      </h2>
      <p className="mt-1 text-[12px] text-muted-foreground">{NEXT_HINTS[currentStatus]}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">নতুন স্ট্যাটাস *</label>
          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as ApplicationStatus)}
            className={cn(inputClass, "mt-1")}
            aria-label="নতুন স্ট্যাটাস নির্বাচন"
          >
            {OFFICER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {APPLICATION_STATUS_META[value]?.label ?? value}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold">লিখিত স্কোর</label>
            <input
              value={examScore}
              onChange={(e) => setExamScore(e.target.value.replace(/\D/g, "").slice(0, 3))}
              inputMode="numeric"
              placeholder="০–১০০"
              dir="ltr"
              className={cn(inputClass, "mt-1")}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">মৌখিক স্কোর</label>
            <input
              value={vivaScore}
              onChange={(e) => setVivaScore(e.target.value.replace(/\D/g, "").slice(0, 3))}
              inputMode="numeric"
              placeholder="০–১০০"
              dir="ltr"
              className={cn(inputClass, "mt-1")}
            />
          </div>
        </div>
      </div>

      <div className="mt-3.5">
        <label className="text-sm font-semibold">মন্তব্য (ইভেন্টে সংরক্ষিত হবে)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          dir="rtl"
          placeholder="যেমন: কাগজপত্র যাচাই সম্পন্ন, পরীক্ষার রোল নম্বর ১৭…"
          className={cn(inputClass, "mt-1 resize-y")}
          maxLength={400}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
        <button
          type="button"
          onClick={onStatusChange}
          disabled={saving}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
          স্ট্যাটাস বদলান
        </button>
        <button
          type="button"
          onClick={onNoteOnly}
          disabled={noting}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary disabled:opacity-50"
        >
          {noting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <MessageSquarePlus aria-hidden className="h-4 w-4" />}
          শুধু মন্তব্য যোগ
        </button>
      </div>

      <div className="mt-3">
        <label className="text-[12px] font-semibold text-muted-foreground">আভ্যন্তরীণ রিভিউ নোট (ঐচ্ছিক, আবেদনের সাথে সংরক্ষিত)</label>
        <textarea
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          rows={2}
          dir="rtl"
          placeholder="অফিসারের নোট — আবেদনকারী দেখবেন না…"
          className={cn(inputClass, "mt-1 resize-y")}
          maxLength={1000}
        />
      </div>
    </section>
  );
}
