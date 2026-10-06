"use client";

import { useState, type FormEvent } from "react";
import { HandHeart, Loader2, Lock, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CampaignChip, DonationSummaryPanel } from "./summary-panel";
import { AmountSection, DonorFields, MessageField, OptionsSection, SponsorSection } from "./form-fields";
import {
  parseAmount,
  type CampaignOption,
  type CurrencyCode,
  type PaymentInfo,
  type ReceiptData,
} from "../donation-types";
import type { PaymentChannelInfo } from "../payment-channels";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "@/hooks/use-toast";
import type { FundType, Language } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface DonationFormProps {
  fundType: FundType;
  initialAmount: number | null;
  /** Selected campaign (from ?campaign=slug) — locks the fund to the campaign's fund. */
  campaign: CampaignOption | null;
  onClearCampaign: () => void;
  lang: Language;
  /** DB-driven fund labels (title per fund key). */
  fundLabels: Record<FundType, { bn: string; en: string }>;
  /** DB-driven payment channel numbers (live summary panel). */
  payment: PaymentChannelInfo;
  onSuccess: (receipt: ReceiptData) => void;
}

/** The donation form: amount presets, currency, donor details, sponsor mode, campaign targeting. */
export function DonationForm({
  fundType,
  initialAmount,
  campaign,
  onClearCampaign,
  lang,
  fundLabels,
  payment,
  onSuccess,
}: DonationFormProps) {
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
          ...(campaign ? { campaignSlug: campaign.slug } : {}),
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
        data?: { receiptNo: string; trackingCode?: string; message: string; paymentInfo: PaymentInfo; checkoutUrl?: string | null };
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
        trackingCode: payload.data.trackingCode ?? payload.data.receiptNo,
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

        {campaign ? <CampaignChip campaign={campaign} lang={lang} onClear={onClearCampaign} /> : null}

        {isSponsor ? (
          <SponsorSection
            studentRef={studentRef}
            lang={lang}
            setStudentRef={setStudentRef}
            onPickStudent={(monthlyCost) => setAmount(String(monthlyCost))}
          />
        ) : null}

        <AmountSection
          amount={amount}
          setAmount={setAmount}
          numericAmount={numericAmount}
          currency={currency}
          setCurrency={setCurrency}
          lang={lang}
          amountError={fieldErrors.amount}
        />

        <DonorFields
          donorName={donorName}
          setDonorName={setDonorName}
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          fieldErrors={fieldErrors}
        />

        <OptionsSection
          anonymous={anonymous}
          setAnonymous={setAnonymous}
          recurring={recurring}
          setRecurring={setRecurring}
          lang={lang}
        />

        <MessageField message={message} setMessage={setMessage} lang={lang} />

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
      <DonationSummaryPanel
        lang={lang}
        fundType={fundType}
        fundLabel={fundLabel}
        numericAmount={numericAmount}
        currency={currency}
        recurring={recurring}
        anonymous={anonymous}
        studentRef={studentRef}
        payment={payment}
      />
    </div>
  );
}
