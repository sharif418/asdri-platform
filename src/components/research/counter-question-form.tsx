"use client";

import { useState, type FormEvent } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "@/hooks/use-toast";
import type { FatwaCategory, Language } from "@/types";

const counterCategories: { value: FatwaCategory; labelBn: string; labelEn: string }[] = [
  { value: "aqidah", labelBn: "আকীদা ও মতাদর্শ", labelEn: "Creed & Ideologies" },
  { value: "contemporary", labelBn: "সমকালীন বিষয়", labelEn: "Contemporary Issues" },
  { value: "ibadat", labelBn: "ইবাদত", labelEn: "Worship" },
  { value: "muamalat", labelBn: "লেনদেন", labelEn: "Transactions" },
  { value: "family", labelBn: "পারিবারিক", labelEn: "Family" },
];

interface CounterQuestionFormProps {
  lang: Language;
  topicLabel: string;
}

/**
 * Counter-question submission — any doubt raised against a topic can be
 * sent to the research board (persisted via POST /api/fatwa).
 */
export function CounterQuestionForm({ lang, topicLabel }: CounterQuestionFormProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<FatwaCategory>("aqidah");
  const [question, setQuestion] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/fatwa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, question, isPrivate }),
      });
      const payload: { data?: { message: string }; error?: string; fields?: Record<string, string> } =
        await res.json();
      if (!res.ok) {
        if (payload.fields) {
          toast({ title: Object.values(payload.fields)[0] ?? t("toast.error"), variant: "destructive" });
        } else {
          toast({ title: payload.error ?? t("toast.error"), variant: "destructive" });
        }
        return;
      }
      toast({
        title: t("toast.success"),
        description: payload.data?.message,
      });
      setQuestion("");
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-gold/30 bg-card p-6 shadow-sm sm:p-8"
      aria-label={lang === "bn" ? "প্রতিপ্রশ্ন জমা দিন" : "Submit a counter-question"}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />
      <h3 className="font-heading flex items-center gap-2.5 text-lg font-semibold">
        <SendHorizontal aria-hidden className="h-5 w-5 text-gold" />
        {lang === "bn" ? "আপনার প্রতিপ্রশ্ন পাঠান" : "Send Your Counter-Question"}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {lang === "bn"
          ? `“${topicLabel}” নিয়ে মনে কোনো সংশয় বা কারো আপত্তি শুনেছেন? গবেষণা বোর্ডের কাছে পাঠান — ইনশাআল্লাহ প্রামাণ্য জবাব পাবেন।`
          : `Heard an objection regarding "${topicLabel}"? Send it to the research board and receive an evidence-based answer, in shaa Allah.`}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="counter-name">{t("label.name")} *</Label>
          <Input
            id="counter-name"
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="counter-email">{t("label.email")} *</Label>
          <Input
            id="counter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <Label>{t("label.category")} *</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as FatwaCategory)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {counterCategories.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {lang === "bn" ? option.labelBn : option.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="counter-question">
          {lang === "bn" ? "সংশয় / আপত্তির বিবরণ" : "Describe the doubt / objection"} *
        </Label>
        <Textarea
          id="counter-question"
          required
          minLength={15}
          maxLength={4000}
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            lang === "bn"
              ? "কী শুনেছেন, কোথা থেকে শুনেছেন ও ঠিক কোন বিন্দুতে সংশয় হচ্ছে — যত স্পষ্ট লিখবেন, জবাব তত প্রাসঙ্গিক হবে…"
              : "What you heard, where, and exactly which point troubles you — the clearer the context, the more precise the answer…"
          }
        />
      </div>

      <div className="mt-4 flex items-start gap-2.5">
        <Checkbox
          id="counter-private"
          checked={isPrivate}
          onCheckedChange={(checked) => setIsPrivate(checked === true)}
          className="mt-0.5"
        />
        <Label htmlFor="counter-private" className="text-[13px] font-normal leading-snug text-muted-foreground">
          {lang === "bn"
            ? "আমার প্রশ্নটি ওয়েবসাইটে প্রকাশ্যে প্রকাশ না করে শুধু ইমেইলে উত্তর দিন"
            : "Answer by email only — do not publish my question on the website"}
        </Label>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full bg-primary text-[15px] font-semibold hover:bg-primary/90 sm:w-auto sm:px-10"
      >
        {submitting ? (
          <>
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            {t("action.sending")}
          </>
        ) : (
          <>
            <SendHorizontal aria-hidden className="h-4 w-4" />
            {t("action.submit")}
          </>
        )}
      </Button>
    </form>
  );
}
