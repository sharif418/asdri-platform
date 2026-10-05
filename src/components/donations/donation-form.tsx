"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Calculator,
  HandHeart,
  HeartHandshake,
  Loader2,
  Lock,
  Repeat,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { StarMotif } from "@/components/shared/ornaments";
import { PaymentChannels, type PaymentChannelInfo } from "./payment-channels";
import { SponsorPicker } from "./sponsor-picker";
import {
  CURRENCY_OPTIONS,
  formatAmount,
  parseAmount,
  type CurrencyCode,
  type PaymentInfo,
  type ReceiptData,
} from "./donation-types";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "@/hooks/use-toast";
import { langPath } from "@/lib/locale";
import type { FundType, Language } from "@/types";
import { cn } from "@/lib/utils";

const AMOUNT_PRESETS = [500, 1000, 2000, 5000] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface DonationFormProps {
  fundType: FundType;
  initialAmount: number | null;
  lang: Language;
  /** DB-driven fund labels (title per fund key). */
  fundLabels: Record<FundType, { bn: string; en: string }>;
  /** DB-driven payment channel numbers (live summary panel). */
  payment: PaymentChannelInfo;
  onSuccess: (receipt: ReceiptData) => void;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[12px] font-medium text-destructive">
      {message}
    </p>
  );
}

/** The donation form: amount presets, currency, donor details, sponsor mode. */
export function DonationForm({ fundType, initialAmount, lang, fundLabels, payment, onSuccess }: DonationFormProps) {
  const { t } = useLanguage();
  const bn = lang === "bn";
  const fundLabel = fundLabels[fundType][lang];

  const [amount, setAmount] = useState<string>(initialAmount ? String(initialAmount) : "1000");
  const [currency, setCurrency] = useState<CurrencyCode>("BDT");
  const [donorName, setDonorName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [message, setMessage] = useState("");
  const [studentRef, setStudentRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const numericAmount = parseAmount(amount);
  const isSponsor = fundType === "sponsor";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    // Client-side validation (mirrors server zod rules).
    const errors: Record<string, string> = {};
    if (numericAmount === null || numericAmount < 10) {
      errors.amount = bn ? "সঠিক পরিমাণ লিখুন (সর্বনিম্ন ১০)" : "Enter a valid amount (min 10)";
    }
    if (donorName.trim().length < 2) {
      errors.donorName = bn ? "নাম কমপক্ষে ২ অক্ষরের হতে হবে" : "Name must be at least 2 characters";
    }
    if (!EMAIL_RE.test(email.trim())) {
      errors.email = bn ? "সঠিক ইমেইল দিন" : "Enter a valid email";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({ title: Object.values(errors)[0], variant: "destructive" });
      return;
    }
    // Validation above already rejected null/undersized amounts; this guard
    // keeps the control flow explicit for the type system (no assertions).
    if (numericAmount === null) return;

    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundType,
          amount: numericAmount,
          currency,
          donorName: donorName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          anonymous,
          studentRef: isSponsor ? studentRef.trim() : "",
          recurring,
          message: message.trim(),
        }),
      });
      const payload: {
        data?: { receiptNo: string; message: string; paymentInfo: PaymentInfo; checkoutUrl?: string | null };
        error?: string;
        fields?: Record<string, string>;
      } = await res.json();

      if (!res.ok || !payload.data) {
        if (payload.fields) {
          setFieldErrors(payload.fields);
          toast({ title: Object.values(payload.fields)[0] ?? t("toast.error"), variant: "destructive" });
        } else {
          toast({ title: payload.error ?? t("toast.error"), variant: "destructive" });
        }
        return;
      }

      toast({ title: t("toast.success"), description: bn ? "রিসিপ্ট তৈরি হয়েছে" : "Receipt generated" });
      setMessage("");
      onSuccess({
        receiptNo: payload.data.receiptNo,
        fundType,
        amount: numericAmount,
        currency,
        donorName: donorName.trim(),
        email: email.trim(),
        anonymous,
        recurring,
        createdAt: new Date().toISOString(),
        paymentInfo: payload.data.paymentInfo,
        message: payload.data.message,
        checkoutUrl: payload.data.checkoutUrl ?? null,
      });
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="donation-form" className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ——— Form card ——— */}
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={bn ? "অনুদান ফর্ম" : "Donation form"}
        className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
      >
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading flex items-center gap-2.5 text-lg font-semibold">
            <HandHeart aria-hidden className="h-5 w-5 text-gold" />
            {bn ? "অনুদানের বিবরণ" : "Donation Details"}
          </h3>
          <Badge variant="outline" className="border-gold/40 bg-gold/10 font-semibold text-gold">
            {fundLabel}
          </Badge>
        </div>

        {/* Sponsor student picker */}
        {isSponsor ? (
          <div className="mt-6">
            <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold">
              <Star aria-hidden className="h-3.5 w-3.5 text-gold" />
              {bn ? "শিক্ষার্থী নির্বাচন করুন" : "Choose a Student"}
            </p>
            <SponsorPicker
              value={studentRef}
              lang={lang}
              onChange={setStudentRef}
              onPickStudent={(monthlyCost) => setAmount(String(monthlyCost))}
            />
          </div>
        ) : null}

        {/* Amount + currency */}
        <div className="mt-6">
          <Label htmlFor="donation-amount" className="text-[13px]">
            {bn ? "পরিমাণ" : "Amount"} <span className="text-destructive">*</span>
          </Label>
          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {AMOUNT_PRESETS.map((preset) => {
              const active = numericAmount === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setAmount(String(preset))}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-[14px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                    active
                      ? "border-gold/70 bg-gold/10 text-gold ring-1 ring-gold/40"
                      : "border-border bg-background hover:border-gold/50",
                  )}
                >
                  {formatAmount(preset, currency, lang)}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-1.5">
              <Label htmlFor="donation-amount" className="sr-only">
                {bn ? "কাস্টম পরিমাণ" : "Custom amount"}
              </Label>
              <Input
                id="donation-amount"
                dir="ltr"
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={bn ? "অথবা নিজের পরিমাণ লিখুন" : "Or enter a custom amount"}
                aria-invalid={Boolean(fieldErrors.amount)}
                aria-describedby={fieldErrors.amount ? "donation-amount-error" : undefined}
                className="h-11 text-[15px] font-semibold"
              />
              <FieldError id="donation-amount-error" message={fieldErrors.amount} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="donation-currency" className="text-[12.5px] text-muted-foreground">
                {bn ? "মুদ্রা" : "Currency"}
              </Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                <SelectTrigger id="donation-currency" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {bn ? option.labelBn : option.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Donor info */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="donor-name">
              {t("label.name")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="donor-name"
              required
              minLength={2}
              maxLength={120}
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              aria-invalid={Boolean(fieldErrors.donorName)}
              aria-describedby={fieldErrors.donorName ? "donor-name-error" : undefined}
            />
            <FieldError id="donor-name-error" message={fieldErrors.donorName} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="donor-email">
              {t("label.email")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="donor-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "donor-email-error" : undefined}
            />
            <FieldError id="donor-email-error" message={fieldErrors.email} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="donor-phone">
              {t("label.phone")}{" "}
              <span className="text-[11px] font-normal text-muted-foreground">({t("label.optional")})</span>
            </Label>
            <Input
              id="donor-phone"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+8801XXXXXXXXX"
            />
          </div>
        </div>

        {/* Options */}
        <div className="mt-6 grid gap-3 rounded-xl border bg-muted/40 p-4 sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="donation-anonymous"
              checked={anonymous}
              onCheckedChange={(checked) => setAnonymous(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="donation-anonymous" className="text-[13px] font-normal leading-snug text-muted-foreground">
              {bn ? "আমার নাম প্রকাশ্যে দেখাবেন না" : "Keep my name anonymous publicly"}
            </Label>
          </div>
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="donation-recurring"
              checked={recurring}
              onCheckedChange={(checked) => setRecurring(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="donation-recurring" className="text-[13px] font-normal leading-snug text-muted-foreground">
              {bn ? "মাসিক অটো-ডোনেশন" : "Make it a monthly auto-donation"}
            </Label>
          </div>
        </div>

        {/* Message */}
        <div className="mt-5 space-y-1.5">
          <Label htmlFor="donation-message">
            {bn ? "অতিরিক্ত বার্তা বা দোয়া" : "Message or du'a"}{" "}
            <span className="text-[11px] font-normal text-muted-foreground">({t("label.optional")})</span>
          </Label>
          <Textarea
            id="donation-message"
            rows={3}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              bn
                ? "প্রয়োজনে নির্দেশনা বা দোয়া লিখুন — যেমন: আমার মৃত পিতার নামে দান করছি…"
                : "Optional instructions or du'a — e.g. donating on behalf of my late father…"
            }
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full bg-gold-gradient text-[15px] font-bold text-gold-foreground shadow-lg shadow-gold/20 hover:opacity-95"
        >
          {submitting ? (
            <>
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              {bn ? "প্রসেস হচ্ছে…" : "Processing…"}
            </>
          ) : (
            <>
              <Send aria-hidden className="h-4 w-4" />
              {bn ? "অনুদান নিশ্চিত করুন" : "Confirm Donation"}
            </>
          )}
        </Button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-muted-foreground">
          <Lock aria-hidden className="h-3 w-3" />
          {bn
            ? "আপনার তথ্য সুরক্ষিত থাকবে — শুধুমাত্র রিসিপ্ট ও প্রয়োজনীয় যোগাযোগে ব্যবহৃত হবে"
            : "Your information stays private — used only for receipts and essential communication"}
        </p>
      </form>

      {/* ——— Live summary panel ——— */}
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label={bn ? "অনুদান সারসংক্ষেপ" : "Donation summary"}>
        <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-emerald-deep p-6 text-ivory shadow-lg">
          <div aria-hidden className="pattern-lattice-light absolute inset-0" />
          <div className="relative">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              <StarMotif className="h-3 w-3" />
              {bn ? "আপনার অনুদান" : "Your Donation"}
            </p>

            <p className="font-heading mt-3 break-words text-3xl font-bold text-gold">
              {numericAmount !== null && numericAmount >= 10
                ? formatAmount(numericAmount, currency, lang)
                : bn
                  ? "— পরিমাণ নির্বাচন করুন"
                  : "— pick an amount"}
            </p>
            <p className="mt-1 text-[13px] text-ivory/70">
              {bn ? "ফান্ড:" : "Fund:"} <span className="font-semibold text-ivory">{fundLabel}</span>
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {recurring ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold">
                  <Repeat aria-hidden className="h-3 w-3" />
                  {bn ? "মাসিক" : "Monthly"}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ivory/20 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-ivory/80">
                {anonymous ? "Anonymous" : bn ? "নাম প্রকাশ্য" : "Named"}
              </span>
            </div>

            {isSponsor ? (
              <p className="mt-4 rounded-lg border border-ivory/15 bg-white/[0.06] p-3 text-[12px] leading-relaxed text-ivory/75">
                {studentRef.trim() ? (
                  <>
                    {bn ? "নির্বাচিত শিক্ষার্থী:" : "Selected student:"}{" "}
                    <span dir="ltr" className="font-mono font-bold text-gold">
                      {studentRef.trim().toUpperCase()}
                    </span>
                  </>
                ) : bn ? (
                  "তালিকা থেকে শিক্ষার্থী নির্বাচন করুন বা কোড লিখুন।"
                ) : (
                  "Pick a student from the list or type a code."
                )}
              </p>
            ) : null}

            {fundType === "zakat" ? (
              <p className="mt-4 rounded-lg border border-gold/30 bg-gold/10 p-3 text-[12px] leading-relaxed text-ivory/80">
                {bn
                  ? "আপনার যাকাত শতভাগ যাকাত-যোগ্য অস্বচ্ছল শিক্ষার্থীদের ফ্রি শিক্ষা, আবাসন ও খাবারে ব্যয় হবে ইনশাআল্লাহ।"
                  : "Your zakat will be spent entirely on zakat-eligible students' education, housing, and meals, in shaa Allah."}
                <Link
                  href={langPath(lang, "/support/zakat-calculator")}
                  className="mt-1.5 inline-flex items-center gap-1 font-semibold text-gold hover:underline"
                >
                  <Calculator aria-hidden className="h-3.5 w-3.5" />
                  {bn ? "যাকাত ক্যালকুলেটর" : "Zakat calculator"}
                </Link>
              </p>
            ) : null}

            <div className="mt-5 border-t border-ivory/15 pt-4">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-gold">
                <ShieldCheck aria-hidden className="h-4 w-4" />
                {bn ? "পেমেন্ট মাধ্যম" : "Payment channels"}
              </p>
              <div className="mt-3 text-ivory">
                <PaymentChannels lang={lang} tone="on-dark" payment={payment} />
              </div>
            </div>

            <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ivory/60">
              <HeartHandshake aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/70" />
              {bn
                ? "সকল অনুদানের হিসাব স্বচ্ছতার সাথে সংরক্ষিত হয় এবং প্রতিবেদন প্রস্তুত করা হয়।"
                : "Every donation is transparently accounted for and reported."}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
