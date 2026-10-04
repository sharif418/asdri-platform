"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { AdminFatwaQuestionData } from "@/components/admin/admin-types";
import type { Language } from "@/types";

interface FatwaAnswerDialogProps {
  question: AdminFatwaQuestionData;
  lang: Language;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnswered: (answer: string) => void;
}

/** Answer-writing dialog for fatwa moderation (create or revise an answer). */
export function FatwaAnswerDialog({ question, lang, open, onOpenChange, onAnswered }: FatwaAnswerDialogProps) {
  const bn = lang === "bn";
  const [answer, setAnswer] = useState(question.answer ?? "");
  const [lastId, setLastId] = useState(question.id);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset the draft when the dialog switches to a different question (render-phase reset).
  if (lastId !== question.id) {
    setLastId(question.id);
    setAnswer(question.answer ?? "");
    setFieldError(null);
  }

  async function onSubmitAnswer(): Promise<void> {
    if (submitting) return;
    const trimmed = answer.trim();
    if (trimmed.length < 20) {
      setFieldError(bn ? "উত্তর কমপক্ষে ২০ অক্ষরের হতে হবে" : "The answer must be at least 20 characters");
      return;
    }
    if (trimmed.length > 6000) {
      setFieldError(bn ? "উত্তর ৬০০০ অক্ষরের বেশি হতে পারবে না" : "The answer can be at most 6000 characters");
      return;
    }

    setFieldError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/fatwa-questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: trimmed }),
      });
      const payload: { data?: { message?: string }; error?: string; fields?: Record<string, string> } = await res.json();

      if (!res.ok) {
        if (payload.fields?.answer) setFieldError(payload.fields.answer);
        toast({ title: payload.error ?? (bn ? "সমস্যা হয়েছে" : "Something went wrong"), variant: "destructive" });
        return;
      }

      toast({
        title: payload.data?.message ?? (bn ? "উত্তর সংরক্ষিত হয়েছে" : "Answer saved"),
        description: question.isPrivate
          ? bn
            ? "প্রাইভেট প্রশ্ন — উত্তর প্রশ্নকারীর ইমেইলে পাঠানো হবে।"
            : "Private question — the answer will be emailed to the asker."
          : undefined,
      });
      onOpenChange(false);
      onAnswered(trimmed);
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error — try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-right text-left text-lg leading-snug">
            {question.answer
              ? bn
                ? "উত্তর সম্পাদনা করুন"
                : "Revise the Answer"
              : bn
                ? "ফতোয়ার উত্তর দিন"
                : "Answer the Question"}
          </DialogTitle>
          <DialogDescription className="max-h-32 overflow-y-auto text-left text-[13px] leading-relaxed">
            {question.question}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={`fatwa-answer-${question.id}`}>
              {bn ? "গবেষণা বোর্ডের উত্তর" : "Research board answer"}
            </Label>
            <span aria-live="polite" className="text-[11px] text-muted-foreground">
              {answer.length > 0 ? (bn ? `${answer.length} অক্ষর` : `${answer.length} chars`) : ""}
            </span>
          </div>
          <Textarea
            id={`fatwa-answer-${question.id}`}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={7}
            maxLength={6000}
            placeholder={bn ? "কুরআন-সুন্নাহর আলোকে বিস্তারিত উত্তর লিখুন…" : "Write the detailed answer in light of the Quran and Sunnah…"}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? `fatwa-answer-${question.id}-error` : undefined}
          />
          {fieldError ? (
            <p id={`fatwa-answer-${question.id}-error`} role="alert" className="text-[12px] font-medium text-destructive">
              {fieldError}
            </p>
          ) : (
            <p className="text-[11.5px] text-muted-foreground">
              {bn ? "সংরক্ষণ করলে প্রশ্নটি “উত্তরপ্রাপ্ত” হিসেবে চিহ্নিত হবে।" : "Saving marks the question as answered."}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="min-h-11">
            {bn ? "বাতিল" : "Cancel"}
          </Button>
          <Button
            onClick={() => void onSubmitAnswer()}
            disabled={submitting}
            className="min-h-11 gap-2 bg-gold-gradient font-bold text-gold-foreground hover:opacity-90"
          >
            {submitting ? (
              <>
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                {bn ? "সংরক্ষণ হচ্ছে…" : "Saving…"}
              </>
            ) : (
              <>
                <Send aria-hidden className="h-4 w-4" />
                {bn ? "উত্তর সংরক্ষণ করুন" : "Save Answer"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
