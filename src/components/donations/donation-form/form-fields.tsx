"use client";

import { Star } from "lucide-react";
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
import { CURRENCY_OPTIONS, formatAmount, type CurrencyCode } from "../donation-types";
import { SponsorPicker } from "../sponsor-picker";
import { useLanguage } from "@/components/providers/language-provider";
import type { Language } from "@/types";
import { cn } from "@/lib/utils";

const AMOUNT_PRESETS = [500, 1000, 2000, 5000] as const;

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[12px] font-medium text-destructive">
      {message}
    </p>
  );
}

/** Preset buttons + custom amount + currency select. */
export function AmountSection({
  amount,
  setAmount,
  numericAmount,
  currency,
  setCurrency,
  lang,
  amountError,
}: {
  amount: string;
  setAmount: (v: string) => void;
  numericAmount: number | null;
  currency: CurrencyCode;
  setCurrency: (v: CurrencyCode) => void;
  lang: Language;
  amountError?: string;
}) {
  const bn = lang === "bn";
  return (
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
            aria-invalid={Boolean(amountError)}
            aria-describedby={amountError ? "donation-amount-error" : undefined}
            className="h-11 text-[15px] font-semibold"
          />
          <FieldError id="donation-amount-error" message={amountError} />
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
  );
}

/** Sponsor-student picker block (only shown for the sponsor fund). */
export function SponsorSection({
  studentRef,
  lang,
  setStudentRef,
  onPickStudent,
}: {
  studentRef: string;
  lang: Language;
  setStudentRef: (v: string) => void;
  onPickStudent: (monthlyCost: number) => void;
}) {
  const bn = lang === "bn";
  return (
    <div className="mt-6">
      <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold">
        <Star aria-hidden className="h-3.5 w-3.5 text-gold" />
        {bn ? "শিক্ষার্থী নির্বাচন করুন" : "Choose a Student"}
      </p>
      <SponsorPicker value={studentRef} lang={lang} onChange={setStudentRef} onPickStudent={onPickStudent} />
    </div>
  );
}

/** Name / email / phone. */
export function DonorFields({
  donorName,
  setDonorName,
  email,
  setEmail,
  phone,
  setPhone,
  fieldErrors,
}: {
  donorName: string;
  setDonorName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  fieldErrors: Record<string, string>;
}) {
  const { t } = useLanguage();
  return (
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
  );
}

/** Anonymous + recurring checkboxes. */
export function OptionsSection({
  anonymous,
  setAnonymous,
  recurring,
  setRecurring,
  lang,
}: {
  anonymous: boolean;
  setAnonymous: (v: boolean) => void;
  recurring: boolean;
  setRecurring: (v: boolean) => void;
  lang: Language;
}) {
  const bn = lang === "bn";
  return (
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
  );
}

/** Optional message / du'a. */
export function MessageField({
  message,
  setMessage,
  lang,
}: {
  message: string;
  setMessage: (v: string) => void;
  lang: Language;
}) {
  const bn = lang === "bn";
  const { t } = useLanguage();
  return (
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
  );
}
