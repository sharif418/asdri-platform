"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface ExamLetterDialogProps {
  applicationId: string;
  /** Intake id — time/venue persist back to it when the officer asks. */
  intakeId: string;
  /** Intake exam date (Bangla-formatted) prefilled into তারিখ; "" unscheduled. */
  defaultDate: string;
  /** Intake's persisted exam time ("" when the office has not set one). */
  defaultTime: string;
  /** Intake's persisted exam venue ("" when the office has not set one). */
  defaultVenue: string;
}

/**
 * Officer's bridge to the exam-call letter (প্রবেশপত্র): collects the exam
 * date/time/venue, then opens the A4 admit-card pad in a new tab — the pad
 * isolates itself and auto-opens the print dialog (see PrintOnLoad). Fields
 * left empty print as hand-fillable placeholders.
 *
 * Round 5: the time and venue prefill from the intake and can be saved back
 * to it, so the schedule is entered once instead of re-typed for every
 * candidate's letter (the date itself stays a structured intake field,
 * edited in the intake form).
 */
export function ExamLetterDialog({
  applicationId,
  intakeId,
  defaultDate,
  defaultTime,
  defaultVenue,
}: ExamLetterDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [venue, setVenue] = useState(defaultVenue);
  const [saveToIntake, setSaveToIntake] = useState(false);
  const [saving, setSaving] = useState(false);

  function printLetter() {
    const params = new URLSearchParams();
    if (date.trim()) params.set("date", date.trim());
    if (time.trim()) params.set("time", time.trim());
    if (venue.trim()) params.set("venue", venue.trim());
    const query = params.toString();
    window.open(
      `/admin/admissions/applications/${applicationId}/exam-letter${query ? `?${query}` : ""}`,
      "_blank",
      "noopener",
    );
    setOpen(false);
  }

  async function saveScheduleThenPrint() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/intakes/${intakeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "",
        },
        body: JSON.stringify({ examTimeBn: time.trim(), examVenueBn: venue.trim() }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string> };
      if (!res.ok || !json.ok) {
        const firstField = json.fields ? Object.values(json.fields)[0] : null;
        toast({ title: firstField ?? json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "ইনটেকে সংরক্ষিত — এখন থেকে সব প্রবেশপত্রে আগে থেকেই আসবে" });
      printLetter();
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold/[0.06] px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <Printer aria-hidden className="h-4 w-4 text-gold" />
          প্রবেশপত্র প্রিন্ট
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">লিখিত পরীক্ষার প্রবেশপত্র</DialogTitle>
          <DialogDescription className="leading-relaxed">
            প্রবেশপত্রে ছাপার জন্য পরীক্ষার তারিখ, সময় ও স্থান লিখুন — নতুন ট্যাবে A4 প্রবেশপত্র খুলবে ও প্রিন্ট ডায়ালগ আসবে। কিছু খালি রাখলে সেখানে হাতে লেখার জায়গা ছাপা হবে।
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exam-letter-date" className="text-[13px] font-semibold">
              তারিখ
            </Label>
            <Input
              id="exam-letter-date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              placeholder="যেমন: ১৫ মার্চ ২০২৬"
              className="h-11 bg-background"
            />
            <p className="text-[11px] text-muted-foreground">
              ইনটেক ফর্মের “পরীক্ষার তারিখ” থেকে আগে থেকেই ভরা — বদলালে শুধু এই ছাপার জন্য বদলাবে।
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-letter-time" className="text-[13px] font-semibold">
              সময়
            </Label>
            <Input
              id="exam-letter-time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              placeholder="যেমন: সকাল ১০:০০"
              maxLength={60}
              className="h-11 bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-letter-venue" className="text-[13px] font-semibold">
              স্থান
            </Label>
            <Input
              id="exam-letter-venue"
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="যেমন: মূল ক্যাম্পাস, কক্ষ ২০১"
              maxLength={160}
              className="h-11 bg-background"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/30 bg-gold/[0.05] px-3.5 py-3">
            <div>
              <p className="text-[13px] font-semibold">ইনটেকে সংরক্ষণ করুন</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                সময় ও স্থান এই ইনটেকের সব প্রবেশপত্রে আগে থেকেই ছাপা হবে এবং আবেদনকারীর অবস্থা-পাতায় দেখা যাবে।
              </p>
            </div>
            <Switch
              checked={saveToIntake}
              onCheckedChange={setSaveToIntake}
              aria-label="সময় ও স্থান ইনটেকে সংরক্ষণ"
            />
          </div>
        </div>
        <DialogFooter>
          {saveToIntake ? (
            <Button
              type="button"
              onClick={saveScheduleThenPrint}
              disabled={saving}
              className="gap-2 bg-primary font-semibold hover:bg-primary/90"
            >
              <Save aria-hidden className="h-4 w-4" />
              সংরক্ষণ করে প্রিন্ট
            </Button>
          ) : (
            <Button
              type="button"
              onClick={printLetter}
              className="gap-2 bg-primary font-semibold hover:bg-primary/90"
            >
              <Printer aria-hidden className="h-4 w-4" />
              প্রিন্ট করুন
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
