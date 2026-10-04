"use client";

import { useState, type FormEvent } from "react";
import { Loader2, MessageCircleQuestion, Send } from "lucide-react";
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
import { fatwaCategoryOptions } from "./fatwa-shared";

/**
 * Full "Ask a Question" form — POST /api/fatwa with name, email,
 * optional phone, category, question, and a privacy checkbox.
 */
export function FatwaAskForm({ lang }: { lang: Language }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<FatwaCategory>("ibadat");
  const [question, setQuestion] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/fatwa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, category, question, isPrivate }),
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
      toast({ title: t("toast.success"), description: payload.data?.message });
      setQuestion("");
      setPhone("");
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onAsk}
      className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
      aria-label={lang === "bn" ? "প্রশ্ন জমা দিন" : "Ask a question"}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />
      <h3 className="font-heading flex items-center gap-2.5 text-lg font-semibold">
        <MessageCircleQuestion aria-hidden className="h-5 w-5 text-gold" />
        {lang === "bn" ? "আপনার প্রশ্ন জমা দিন" : "Submit Your Question"}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {lang === "bn"
          ? "দৈনন্দিন ফিকহ, আকীদা বা সমকালীন যেকোনো বিষয়ে জিজ্ঞাসা করুন — ফিকহ ও গবেষণা বোর্ড থেকে প্রামাণ্য লিখিত উত্তর পাবেন ইনশাআল্লাহ।"
          : "Ask about everyday fiqh, creed, or any contemporary issue — the fiqh & research board sends an authentic written answer, in shaa Allah."}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ask-name">{t("label.name")} *</Label>
          <Input
            id="ask-name"
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ask-email">{t("label.email")} *</Label>
          <Input
            id="ask-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ask-phone">
            {t("label.phone")} <span className="text-[11px] text-muted-foreground">({t("label.optional")})</span>
          </Label>
          <Input
            id="ask-phone"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+8801XXXXXXXXX"
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("label.category")} *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as FatwaCategory)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fatwaCategoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {lang === "bn" ? option.labelBn : option.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="ask-question">
          {lang === "bn" ? "আপনার প্রশ্ন" : "Your Question"} *
        </Label>
        <Textarea
          id="ask-question"
          required
          minLength={15}
          maxLength={4000}
          rows={5}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            lang === "bn"
              ? "বিস্তারিতভাবে প্রশ্নটি লিখুন — প্রাসঙ্গিক তথ্য দিলে উত্তর আরও স্পষ্ট হবে ইনশাআল্লাহ…"
              : "Write your question in detail — context helps produce a clearer answer, in shaa Allah…"
          }
        />
      </div>

      <div className="mt-4 flex items-start gap-2.5">
        <Checkbox
          id="ask-private"
          checked={isPrivate}
          onCheckedChange={(checked) => setIsPrivate(checked === true)}
          className="mt-0.5"
        />
        <Label htmlFor="ask-private" className="text-[13px] font-normal leading-snug text-muted-foreground">
          {lang === "bn"
            ? "আমার প্রশ্নটি ওয়েবসাইটে প্রকাশ্যে প্রকাশ না করে শুধু ইমেইলে উত্তর দিন"
            : "Answer by email only — do not publish my question on the website"}
        </Label>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full bg-primary text-[15px] font-semibold hover:bg-primary/90"
      >
        {submitting ? (
          <>
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            {t("action.sending")}
          </>
        ) : (
          <>
            <Send aria-hidden className="h-4 w-4" />
            {t("action.submit")}
          </>
        )}
      </Button>
    </form>
  );
}
