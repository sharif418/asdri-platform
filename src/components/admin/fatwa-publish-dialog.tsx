"use client";

import { useMemo, useState } from "react";
import { BookMarked, CheckCircle2, Eye, Globe, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { fatwaCategoryLabel } from "@/components/research/fatwa-shared";
import { containsBengali, slugifyTitle } from "@/lib/slug";
import { formatDate, toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminFatwaQuestionData } from "@/components/admin/admin-types";
import type { FatwaCategory, Language } from "@/types";

interface FatwaPublishDialogProps {
  question: AdminFatwaQuestionData;
  lang: Language;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished: (slug: string) => void;
}

interface FieldErrors {
  questionBn?: string;
  questionEn?: string;
  answerBn?: string;
  answerEn?: string;
  answeredBy?: string;
  slug?: string;
  form?: string;
}

const DEFAULT_ANSWERER_BN = "আস-সুন্নাহ গবেষণা বোর্ড";
const DEFAULT_ANSWERER_EN = "As-Sunnah Research Board";

/**
 * Promote an answered question into the public fatwa bank — bilingual fields
 * (auto-prefilled from the asker's language) with a live bank-card preview.
 */
export function FatwaPublishDialog({ question, lang, open, onOpenChange, onPublished }: FatwaPublishDialogProps) {
  const bn = lang === "bn";
  const questionIsBn = containsBengali(question.question);

  const [questionBn, setQuestionBn] = useState(questionIsBn ? question.question : "");
  const [questionEn, setQuestionEn] = useState(questionIsBn ? "" : question.question);
  const [answerBn, setAnswerBn] = useState(question.answer && containsBengali(question.answer) ? question.answer : "");
  const [answerEn, setAnswerEn] = useState(question.answer && !containsBengali(question.answer) ? question.answer : "");
  const [answeredBy, setAnsweredBy] = useState(bn ? DEFAULT_ANSWERER_BN : DEFAULT_ANSWERER_EN);
  const [slugOverride, setSlugOverride] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const autoSlug = useMemo(
    () => slugifyTitle(questionEn) || slugifyTitle(question.question) || "fatwa",
    [questionEn, question.question],
  );
  const finalSlug = slugOverride.trim() || autoSlug;

  function validate(): boolean {
    const next: FieldErrors = {};
    if (questionBn.trim().length < 8) next.questionBn = bn ? "বাংলা প্রশ্ন কমপক্ষে ৮ অক্ষরের হতে হবে" : "Bengali question needs at least 8 characters";
    if (questionEn.trim().length < 8) next.questionEn = bn ? "ইংরেজি প্রশ্ন কমপক্ষে ৮ অক্ষরের হতে হবে" : "English question needs at least 8 characters";
    if (answerBn.trim().length < 20) next.answerBn = bn ? "বাংলা উত্তর কমপক্ষে ২০ অক্ষরের হতে হবে" : "Bengali answer needs at least 20 characters";
    if (answerEn.trim().length < 20) next.answerEn = bn ? "ইংরেজি উত্তর কমপক্ষে ২০ অক্ষরের হতে হবে" : "English answer needs at least 20 characters";
    if (answeredBy.trim().length < 3) next.answeredBy = bn ? "উত্তরদাতার নাম কমপক্ষে ৩ অক্ষরের" : "Answerer name needs at least 3 characters";
    if (slugOverride.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugOverride.trim())) {
      next.slug = bn ? "slug ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন দিয়ে গঠিত হতে হবে" : "slug: lowercase letters, digits and hyphens only";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onPublish(): Promise<void> {
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/fatwa-questions/${question.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionBn: questionBn.trim(),
          questionEn: questionEn.trim(),
          answerBn: answerBn.trim(),
          answerEn: answerEn.trim(),
          answeredBy: answeredBy.trim(),
          slug: slugOverride.trim(),
        }),
      });
      const payload: { data?: { slug?: string; message?: string }; error?: string; fields?: Record<string, string> } = await res.json();
      if (!res.ok) {
        setErrors({ form: payload.error ?? (bn ? "প্রকাশ করা যায়নি" : "Publish failed"), ...(payload.fields ?? {}) });
        return;
      }
      toast({ title: payload.data?.message ?? (bn ? "ফতোয়াটি প্রকাশিত হয়েছে" : "Fatwa published") });
      onPublished(payload.data?.slug ?? finalSlug);
    } catch {
      setErrors({ form: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = "min-h-11 text-[13.5px]";
  const areaClass = "min-h-32 resize-y text-[13.5px] leading-relaxed transition-shadow focus-visible:shadow-[0_0_0_3px_rgba(212,175,55,0.15)]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="scrollbar-thin max-h-[92dvh] gap-5 overflow-y-auto p-0 sm:max-w-2xl">
        {/* Gold top rule */}
        <div aria-hidden className="h-1.5 bg-gold-gradient" />

        <DialogHeader className="relative space-y-2 px-5 pt-5 sm:px-6">
          <div aria-hidden className="pattern-lattice-light pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <DialogTitle className="font-heading relative flex items-center gap-2.5 text-xl">
            <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
              <BookMarked className="h-4.5 w-4.5" />
            </span>
            {bn ? "ফতোয়া ব্যাংকে প্রকাশ করুন" : "Publish to the Fatwa Bank"}
          </DialogTitle>
          <DialogDescription className="relative leading-relaxed">
            {bn
              ? "উত্তরপ্রাপ্ত প্রশ্নটি দ্বিভাষিক এন্ট্রি হিসেবে প্রকাশ্য ফতোয়া ব্যাংকে যুক্ত হবে — উভয় ভাষার ঘর পূরণ করুন, নিচে লাইভ প্রিভিউ দেখুন।"
              : "The answered question becomes a bilingual entry in the public fatwa bank — fill both languages and watch the live preview below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 sm:px-6">
          {/* Questions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pub-question-bn" className="flex items-center gap-1.5 text-[12.5px] font-bold">
                <Badge variant="outline" className="h-5 border-primary/40 bg-primary/10 px-1.5 text-[10px] font-bold text-primary dark:text-gold">বাংলা</Badge>
                {bn ? "প্রশ্ন (বাংলা)" : "Question (Bangla)"}
                <span className="ml-auto font-mono text-[10px] font-normal text-muted-foreground">{toBnDigits(questionBn.length)}/১০০০</span>
              </Label>
              <Textarea
                id="pub-question-bn"
                value={questionBn}
                onChange={(e) => setQuestionBn(e.target.value)}
                placeholder={bn ? "প্রশ্নের বাংলা রূপ…" : "Bangla version of the question…"}
                rows={3}
                maxLength={1000}
                className={areaClass}
                aria-invalid={Boolean(errors.questionBn)}
              />
              {errors.questionBn ? <p className="text-[11.5px] font-semibold text-destructive">{errors.questionBn}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pub-question-en" className="flex items-center gap-1.5 text-[12.5px] font-bold">
                <Badge variant="outline" className="h-5 border-border bg-muted px-1.5 text-[10px] font-bold">English</Badge>
                {bn ? "প্রশ্ন (ইংরেজি)" : "Question (English)"}
                <span dir="ltr" className="ml-auto font-mono text-[10px] font-normal text-muted-foreground">{questionEn.length}/1000</span>
              </Label>
              <Textarea
                id="pub-question-en"
                dir="ltr"
                value={questionEn}
                onChange={(e) => setQuestionEn(e.target.value)}
                placeholder="English version of the question…"
                rows={3}
                className={areaClass}
                aria-invalid={Boolean(errors.questionEn)}
              />
              {errors.questionEn ? <p className="text-[11.5px] font-semibold text-destructive">{errors.questionEn}</p> : null}
            </div>
          </div>

          <div aria-hidden className="border-t border-dashed border-border/80" />

          {/* Answers */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pub-answer-bn" className="flex items-center gap-1.5 text-[12.5px] font-bold">
                <Badge variant="outline" className="h-5 border-primary/40 bg-primary/10 px-1.5 text-[10px] font-bold text-primary dark:text-gold">বাংলা</Badge>
                {bn ? "উত্তর (বাংলা)" : "Answer (Bangla)"}
                <span className="ml-auto font-mono text-[10px] font-normal text-muted-foreground">{toBnDigits(answerBn.length)}/৬০০০</span>
              </Label>
              <Textarea
                id="pub-answer-bn"
                value={answerBn}
                onChange={(e) => setAnswerBn(e.target.value)}
                placeholder={bn ? "উত্তরের বাংলা রূপ…" : "Bangla version of the answer…"}
                rows={5}
                className={areaClass}
                aria-invalid={Boolean(errors.answerBn)}
              />
              {errors.answerBn ? <p className="text-[11.5px] font-semibold text-destructive">{errors.answerBn}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pub-answer-en" className="flex items-center gap-1.5 text-[12.5px] font-bold">
                <Badge variant="outline" className="h-5 border-border bg-muted px-1.5 text-[10px] font-bold">English</Badge>
                {bn ? "উত্তর (ইংরেজি)" : "Answer (English)"}
                <span dir="ltr" className="ml-auto font-mono text-[10px] font-normal text-muted-foreground">{answerEn.length}/6000</span>
              </Label>
              <Textarea
                id="pub-answer-en"
                dir="ltr"
                value={answerEn}
                onChange={(e) => setAnswerEn(e.target.value)}
                placeholder="English version of the answer…"
                rows={5}
                className={areaClass}
                aria-invalid={Boolean(errors.answerEn)}
              />
              {errors.answerEn ? <p className="text-[11.5px] font-semibold text-destructive">{errors.answerEn}</p> : null}
            </div>
          </div>

          <div aria-hidden className="border-t border-dashed border-border/80" />

          {/* Answerer + slug */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pub-answered-by" className="text-[12.5px] font-bold">
                {bn ? "উত্তরদাতা" : "Answered by"}
              </Label>
              <Input
                id="pub-answered-by"
                value={answeredBy}
                onChange={(e) => setAnsweredBy(e.target.value)}
                placeholder={DEFAULT_ANSWERER_BN}
                className={fieldClass}
                aria-invalid={Boolean(errors.answeredBy)}
              />
              {errors.answeredBy ? <p className="text-[11.5px] font-semibold text-destructive">{errors.answeredBy}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pub-slug" className="flex items-center justify-between text-[12.5px] font-bold">
                <span>{bn ? "স্লাগ (ঐচ্ছিক)" : "Slug (optional)"}</span>
                <span className="font-mono text-[10.5px] font-normal text-muted-foreground">{finalSlug}</span>
              </Label>
              <Input
                id="pub-slug"
                dir="ltr"
                value={slugOverride}
                onChange={(e) => setSlugOverride(e.target.value)}
                placeholder={autoSlug}
                className={cn(fieldClass, "font-mono text-[12.5px]")}
                aria-invalid={Boolean(errors.slug)}
              />
              {errors.slug ? <p className="text-[11.5px] font-semibold text-destructive">{errors.slug}</p> : null}
            </div>
          </div>

          {/* Live preview */}
          <div className="space-y-2.5">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
              <Eye aria-hidden className="h-3.5 w-3.5 text-gold" />
              {bn ? "লাইভ প্রিভিউ — ব্যাংকে যেমন দেখাবে" : "Live preview — as it appears in the bank"}
            </p>
            <article className="overflow-hidden rounded-2xl border border-gold/50 bg-card shadow-md">
              <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-gold/40 bg-gold/10 text-[10px] font-bold text-gold">
                      {fatwaCategoryLabel(question.category as FatwaCategory, lang)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(new Date().toISOString(), lang)}
                    </span>
                  </div>
                  <h3 className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-snug">
                    {(bn ? questionBn : questionEn).trim() || (bn ? "প্রশ্ন লিখুন…" : "Type the question…")}
                  </h3>
                </div>
                <Sparkles aria-hidden className="mt-1 h-5 w-5 shrink-0 text-gold/70" />
              </div>
              <div className="max-h-40 overflow-y-auto scrollbar-thin border-t bg-parchment/60 px-4 py-3.5 sm:px-5">
                {((bn ? answerBn : answerEn).trim().split(/\n+/).map((p) => p.trim()).filter(Boolean).length > 0)
                  ? (bn ? answerBn : answerEn).trim().split(/\n+/).map((paragraph, index) =>
                      paragraph.trim() ? (
                        <p key={index} className="text-[12.5px] leading-[1.85] text-foreground/90">
                          {paragraph.trim()}
                        </p>
                      ) : null,
                    )
                  : (
                    <p className="text-[12.5px] italic leading-relaxed text-muted-foreground">
                      {bn ? "উত্তর লিখলে এখানে দেখা যাবে…" : "The answer will appear here…"}
                    </p>
                  )}
              </div>
              <p className="flex items-center gap-2 border-t px-4 py-2.5 text-[11.5px] font-semibold text-primary sm:px-5 dark:text-gold">
                <Globe aria-hidden className="h-3.5 w-3.5 text-gold" />
                /research/fatwa · {bn ? `স্লাগ: ${finalSlug}` : `slug: ${finalSlug}`}
              </p>
            </article>
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              {bn
                ? `মোট অক্ষর — প্রশ্ন: ${toBnDigits(questionBn.length)} · উত্তর: ${toBnDigits(answerBn.length)}`
                : `Characters — question: ${questionBn.length} · answer: ${answerBn.length}`}
            </p>
          </div>

          {errors.form ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] font-semibold text-destructive">
              {errors.form}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2.5 border-t bg-muted/40 px-5 py-4 sm:px-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="min-h-11 px-5 text-[13px] font-semibold"
          >
            {bn ? "বাতিল" : "Cancel"}
          </Button>
          <Button
            onClick={() => void onPublish()}
            disabled={submitting}
            className="min-h-11 gap-2 bg-gold-gradient px-6 text-[13.5px] font-bold text-gold-foreground hover:opacity-90"
          >
            {submitting ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 aria-hidden className="h-4 w-4" />
            )}
            {bn ? "ফতোয়া ব্যাংকে প্রকাশ করুন" : "Publish to Fatwa Bank"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
