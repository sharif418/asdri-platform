"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContactFormProps {
  lang: "bn" | "en";
}

interface ApiPayload {
  data?: { message: string };
  error?: string;
  fields?: Record<string, string>;
}

const inputClass = "h-11 rounded-xl bg-card";

/** Contact island — posts to /api/contact and surfaces field errors as toasts. */
export function ContactForm({ lang }: ContactFormProps) {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body: ApiPayload = await res.json();
      if (!res.ok) {
        if (body.fields) {
          setErrors(body.fields);
          const first = Object.values(body.fields)[0];
          if (first) toast({ title: first, variant: "destructive" });
        } else {
          toast({ title: body.error ?? t("toast.error"), variant: "destructive" });
        }
        return;
      }
      toast({ title: t("toast.success"), description: body.data?.message });
      form.reset();
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const bn = lang === "bn";

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      noValidate
      className="space-y-4"
      aria-label={bn ? "যোগাযোগ ফরম" : "Contact form"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">
            {bn ? "আপনার নাম" : "Your name"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            placeholder={bn ? "পূর্ণ নাম লিখুন" : "Enter full name"}
            className={inputClass}
            aria-invalid={errors.name ? true : undefined}
          />
          {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">
            {bn ? "ইমেইল" : "Email"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@example.com"
            className={inputClass}
            aria-invalid={errors.email ? true : undefined}
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-phone">
            {bn ? "ফোন নম্বর" : "Phone"}{" "}
            <span className="text-[11px] font-normal text-muted-foreground">({t("label.optional")})</span>
          </Label>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder={bn ? "০১৭xxxxxxxx" : "+880 17xx-xxxxxx"}
            className={inputClass}
            aria-invalid={errors.phone ? true : undefined}
          />
          {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-subject">
            {bn ? "বিষয়" : "Subject"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-subject"
            name="subject"
            required
            placeholder={bn ? "কী বিষয়ে যোগাযোগ করছেন?" : "What is this about?"}
            className={inputClass}
            aria-invalid={errors.subject ? true : undefined}
          />
          {errors.subject ? <p className="text-xs text-destructive">{errors.subject}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">
          {bn ? "বার্তা" : "Message"} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder={
            bn
              ? "আপনার প্রশ্ন, মতামত বা পরামর্শ বিস্তারিত লিখুন…"
              : "Write your question, feedback, or suggestion in detail…"
          }
          className="resize-y rounded-xl bg-card"
          aria-invalid={errors.message ? true : undefined}
        />
        {errors.message ? <p className="text-xs text-destructive">{errors.message}</p> : null}
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full gap-2 rounded-xl bg-gold-gradient py-6 text-base font-bold text-gold-foreground hover:opacity-90 sm:w-auto sm:px-10"
      >
        {submitting ? (
          <>
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            {t("action.sending")}
          </>
        ) : (
          <>
            <Send aria-hidden className="h-4 w-4" />
            {bn ? "বার্তা পাঠান" : "Send message"}
          </>
        )}
      </Button>
    </form>
  );
}
