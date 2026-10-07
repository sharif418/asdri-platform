"use client";

import { useState } from "react";
import { normalizeDigitsInput } from "@/lib/format";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Loader2, MapPin, Save } from "lucide-react";
import type { IntakeStatus } from "@prisma/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { INTAKE_STATUS_META } from "@/lib/admission-labels";

export interface IntakeCourseOption {
  id: string;
  code: string;
  titleBn: string;
}

export interface IntakeFormValues {
  id?: string;
  courseId: string;
  year: string;
  sessionBn: string;
  sessionEn: string;
  seatsTotal: string;
  opensAt: string;
  closesAt: string;
  examDate: string;
  examTimeBn: string;
  examVenueBn: string;
  status: IntakeStatus;
  isPublished: boolean;
}

const inputClass = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50";

/** "2026-01-15" (date input) → "2026-01-15T00:00:00.000Z" (zod datetime), "" → null. */
function toIsoOrNull(value: string): string | null {
  return value ? new Date(`${value}T00:00:00Z`).toISOString() : null;
}

/** ISO string → "yyyy-mm-dd" for date inputs. */
function toInputDate(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

/** Create or edit an intake — course+year are fixed after creation (API contract). */
export function IntakeDialog({
  courses,
  initial,
  mode,
  trigger,
}: {
  courses: IntakeCourseOption[];
  initial: IntakeFormValues;
  mode: "create" | "edit";
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<IntakeFormValues>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof IntakeFormValues>(key: K, value: IntakeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave() {
    if (saving) return;
    if (!values.courseId || !values.year) {
      toast({ title: "কোর্স ও বছর দিন।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const seats = values.seatsTotal.trim() === "" ? null : Number(values.seatsTotal);
      const body =
        mode === "create"
          ? {
              courseId: values.courseId,
              year: Number(values.year),
              sessionBn: values.sessionBn.trim(),
              sessionEn: values.sessionEn.trim(),
              opensAt: toIsoOrNull(values.opensAt),
              closesAt: toIsoOrNull(values.closesAt),
              examDate: toIsoOrNull(values.examDate),
              examTimeBn: values.examTimeBn.trim(),
              examVenueBn: values.examVenueBn.trim(),
              seatsTotal: seats !== null && Number.isFinite(seats) ? seats : null,
              isPublished: values.isPublished,
              status: values.status,
            }
          : {
              sessionBn: values.sessionBn.trim(),
              sessionEn: values.sessionEn.trim(),
              opensAt: toIsoOrNull(values.opensAt),
              closesAt: toIsoOrNull(values.closesAt),
              examDate: toIsoOrNull(values.examDate),
              examTimeBn: values.examTimeBn.trim(),
              examVenueBn: values.examVenueBn.trim(),
              seatsTotal: seats !== null && Number.isFinite(seats) ? seats : null,
              isPublished: values.isPublished,
              status: values.status,
            };
      const res = await fetch(mode === "create" ? "/api/admin/intakes" : `/api/admin/intakes/${values.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "",
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string> };
      if (!res.ok || !json.ok) {
        const firstField = json.fields ? Object.values(json.fields)[0] : null;
        toast({ title: firstField ?? json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: mode === "create" ? "ইনটেক তৈরি হয়েছে" : "ইনটেক হালনাগাদ হয়েছে" });
      setOpen(false);
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "নতুন ইনটেক তৈরি" : "ইনটেক সম্পাদনা"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "এক কোর্সে এক বছরে একটিই ইনটেক — আসন, সময়সীমা ও পরীক্ষার তারিখ ঠিক করুন।"
              : "কোর্স ও বছর আগেই নির্ধারিত — বাকি তথ্য বদলানো যায়।"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3.5 sm:grid-cols-2">
          {mode === "create" && (
            <>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold">কোর্স *</label>
                <select
                  value={values.courseId}
                  onChange={(e) => set("courseId", e.target.value)}
                  className={inputClass}
                  aria-label="কোর্স নির্বাচন"
                >
                  <option value="">— নির্বাচন করুন —</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} — {course.titleBn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">বছর *</label>
                <input
                  value={values.year}
                  onChange={(e) => set("year", normalizeDigitsInput(e.target.value).slice(0, 4))}
                  inputMode="numeric"
                  placeholder="2026"
                  dir="ltr"
                  className={inputClass}
                />
              </div>
            </>
          )}
          {mode === "edit" && (
            <div className="sm:col-span-2 rounded-lg bg-secondary/50 px-3 py-2 text-[12.5px] font-semibold">
              বছর {values.year} · ইনটেক আইডি: <code className="font-mono text-[11px]">{values.id?.slice(-8)}</code>
            </div>
          )}
          <div>
            <label className="text-sm font-semibold">সেশন (বাংলা)</label>
            <input
              value={values.sessionBn}
              onChange={(e) => set("sessionBn", e.target.value)}
              placeholder="২০২৬ শিক্ষাবর্ষ"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Session (English)</label>
            <input
              value={values.sessionEn}
              onChange={(e) => set("sessionEn", e.target.value)}
              placeholder="2026 academic session"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">মোট আসন</label>
            <input
              value={values.seatsTotal}
              onChange={(e) => set("seatsTotal", normalizeDigitsInput(e.target.value).slice(0, 5))}
              inputMode="numeric"
              placeholder="40"
              dir="ltr"
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">খালি রাখলে আসন সীমা নির্ধারিত হবে না।</p>
          </div>
          <div>
            <label className="text-sm font-semibold">স্ট্যাটাস</label>
            <select
              value={values.status}
              onChange={(e) => set("status", e.target.value as IntakeStatus)}
              className={inputClass}
              aria-label="ইনটেক স্ট্যাটাস"
            >
              {(Object.keys(INTAKE_STATUS_META) as IntakeStatus[]).map((status) => (
                <option key={status} value={status}>
                  {INTAKE_STATUS_META[status].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold">
              <CalendarDays aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
              আবেদন শুরু
            </label>
            <input type="date" value={values.opensAt} onChange={(e) => set("opensAt", e.target.value)} dir="ltr" className={inputClass} />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold">
              <CalendarDays aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
              আবেদন শেষ
            </label>
            <input type="date" value={values.closesAt} onChange={(e) => set("closesAt", e.target.value)} dir="ltr" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-1.5 text-sm font-semibold">
              <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
              পরীক্ষার তারিখ (প্রাথমিক)
            </label>
            <input type="date" value={values.examDate} onChange={(e) => set("examDate", e.target.value)} dir="ltr" className={inputClass} />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold">
              <Clock aria-hidden className="h-3.5 w-3.5 text-gold" />
              পরীক্ষার সময়
            </label>
            <input
              value={values.examTimeBn}
              onChange={(e) => set("examTimeBn", e.target.value)}
              placeholder="যেমন: সকাল ১০:০০"
              maxLength={60}
              className={inputClass}
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold">
              <MapPin aria-hidden className="h-3.5 w-3.5 text-gold" />
              পরীক্ষার স্থান
            </label>
            <input
              value={values.examVenueBn}
              onChange={(e) => set("examVenueBn", e.target.value)}
              placeholder="যেমন: মূল ক্যাম্পাস, কক্ষ ২০১"
              maxLength={160}
              className={inputClass}
            />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground sm:col-span-2 -mt-1">
            সময় ও স্থান সংরক্ষণ করলে এই ইনটেকের সব প্রবেশপত্রে আগে থেকেই ছাপা হবে এবং আবেদনকারীর অবস্থা-পাতায় দেখা যাবে।
          </p>
          <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5 sm:col-span-2">
            <div>
              <p className="text-sm font-semibold">প্রকাশিত</p>
              <p className="text-[11px] text-muted-foreground">খোলা থাকলেও বন্ধ করলে আবেদন ফর্মে দেখা যাবে না</p>
            </div>
            <Switch checked={values.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label="ইনটেক প্রকাশিত" />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSave} disabled={saving} className="gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "ইনটেক তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Normalize DB dates into the dialog's initial values. */
export function intakeFormInitial(intake: {
  id: string;
  courseId: string;
  year: number;
  sessionBn: string;
  sessionEn: string;
  seatsTotal: number | null;
  opensAt: Date | string | null;
  closesAt: Date | string | null;
  examDate: Date | string | null;
  examTimeBn?: string;
  examVenueBn?: string;
  status: IntakeStatus;
  isPublished: boolean;
}): IntakeFormValues {
  const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);
  return {
    id: intake.id,
    courseId: intake.courseId,
    year: String(intake.year),
    sessionBn: intake.sessionBn,
    sessionEn: intake.sessionEn,
    seatsTotal: intake.seatsTotal === null ? "" : String(intake.seatsTotal),
    opensAt: toInputDate(iso(intake.opensAt)),
    closesAt: toInputDate(iso(intake.closesAt)),
    examDate: toInputDate(iso(intake.examDate)),
    examTimeBn: intake.examTimeBn ?? "",
    examVenueBn: intake.examVenueBn ?? "",
    status: intake.status,
    isPublished: intake.isPublished,
  };
}
