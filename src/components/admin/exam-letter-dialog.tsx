"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  /** Intake exam date (Bangla-formatted) prefilled into তারিখ; "" unscheduled. */
  defaultDate: string;
}

/**
 * Officer's bridge to the exam-call letter (প্রবেশপত্র): collects the exam
 * date/time/venue, then opens the A4 admit-card pad in a new tab — the pad
 * isolates itself and auto-opens the print dialog (see PrintOnLoad). Fields
 * left empty print as hand-fillable placeholders.
 */
export function ExamLetterDialog({ applicationId, defaultDate }: ExamLetterDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");

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
              className="h-11 bg-background"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={printLetter}
            className="gap-2 bg-primary font-semibold hover:bg-primary/90"
          >
            <Printer aria-hidden className="h-4 w-4" />
            প্রিন্ট করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
