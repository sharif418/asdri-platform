"use client";

import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Phone,
  Printer,
  ReceiptText,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CopyButton } from "@/components/shared/copy-button";
import { formatAmount, type CurrencyCode } from "@/components/donations/donation-types";
import { formatDate } from "@/lib/format";
import type { Lang } from "@/lib/locale";

interface LookupResult {
  trackingCode: string;
  receiptNo: string | null;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  amount: number;
  currency: CurrencyCode;
  donorName: string;
  isAnonymous: boolean;
  message: string | null;
  fundName: { bn: string; en: string };
  campaignTitle: { bn: string; en: string } | null;
  paidAt: string | null;
  createdAt: string;
  paymentInfo: { bkash: string; nagad: string; rocket: string; bank: string } | null;
}

interface ReceiptLookupFormProps {
  lang: Lang;
}

/** Status pill shared by the badge row. */
function StatusPill({ status, lang }: { status: LookupResult["status"]; lang: Lang }) {
  const bn = lang === "bn";
  const map: Record<LookupResult["status"], { label: string; cls: string }> = {
    PENDING: { label: bn ? "পেমেন্ট অপেক্ষমাণ" : "Awaiting payment", cls: "bg-gold/15 text-gold" },
    COMPLETED: { label: bn ? "সম্পন্ন" : "Completed", cls: "bg-emerald-600/15 text-emerald-700" },
    FAILED: { label: bn ? "ব্যর্থ" : "Failed", cls: "bg-destructive/15 text-destructive" },
    REFUNDED: { label: bn ? "ফেরত দেওয়া" : "Refunded", cls: "bg-muted text-muted-foreground" },
  };
  const pill = map[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${pill.cls}`}>{pill.label}</span>;
}

/**
 * Client island for /support/receipt-lookup — public donation status check.
 * The donor authenticates with the tracking/receipt code PAIRED with the
 * phone or email they gave on the donation form (codes are sequential, so
 * the second factor is what makes this safe — the API enforces it).
 */
export function ReceiptLookupForm({ lang }: ReceiptLookupFormProps) {
  const bn = lang === "bn";
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/donations/status-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          phone: method === "phone" ? phone.trim() : "",
          email: method === "email" ? email.trim() : "",
          lang,
        }),
      });
      const json = (await res.json()) as { data?: LookupResult; error?: string };
      if (!res.ok || !json.data) {
        setError(json.error ?? (bn ? "তথ্য আনা যায়নি।" : "Could not fetch."));
        return;
      }
      setResult(json.data);
    } catch {
      setError(bn ? "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন।" : "Network problem — please try again.");
    } finally {
      setLoading(false);
    }
  }

  /** Print the completed donation as an official receipt (print-zone CSS). */
  function printReceipt() {
    if (!result) return;
    document.body.classList.add("printing-receipt");
    const cleanup = () => {
      document.body.classList.remove("printing-receipt");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, 60_000); // safety net if afterprint never fires
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-12">
      {/* ————— guidance ————— */}
      <aside className="rounded-2xl border border-gold/30 bg-gold/[0.05] p-6 sm:p-8">
        <h2 className="font-heading flex items-center gap-2 text-lg font-bold">
          <ShieldCheck aria-hidden className="h-5 w-5 text-gold" />
          {bn ? "আপনার তথ্য, আপনার হাতে" : "Your record, in your hands"}
        </h2>
        <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
          {bn
            ? "অনুদানের সময় প্রদত্ত ট্র্যাকিং কোড (DN-…) বা রিসিপ্ট নম্বর (ASDRI-R-…) এবং সেই ফর্মে দেওয়া মোবাইল নম্বর বা ইমেইল — এই দুইয়ের জোড়া মিললেই আপনার অনুদানের অবস্থা ও রিসিপ্ট দেখা যাবে।"
            : "Your donation's status and receipt appear when the tracking code (DN-…) or receipt number (ASDRI-R-…) you were given is paired with the phone or email you filled into the donation form."}
        </p>
        <ul className="mt-5 space-y-3 text-[13px] leading-relaxed text-muted-foreground">
          <li className="flex gap-2.5">
            <ReceiptText aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            {bn
              ? "পেমেন্ট অপেক্ষমাণ থাকলে ম্যানুয়াল চ্যানেল ও রেফারেন্স নম্বর আবার দেখতে পাবেন।"
              : "While payment is pending, the manual channels and reference number are shown again."}
          </li>
          <li className="flex gap-2.5">
            <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            {bn
              ? "সম্পন্ন হলে সম্পূর্ণ রিসিপ্ট দেখতে পাবেন — প্রিন্টও করা যায়।"
              : "Once completed, the full receipt is shown — and printable."}
          </li>
          <li className="flex gap-2.5">
            <Clock3 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            {bn
              ? "রিসিপ্ট ইমেইল হারিয়ে গেলে বা নতুন ডিভাইস থেকে দরকার হলে এই পৃষ্ঠাই যথেষ্ট।"
              : "Lost the receipt email or on a new device? This page is all you need."}
          </li>
        </ul>
      </aside>

      {/* ————— form + result ————— */}
      <div className="space-y-6">
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label={bn ? "অনুদানের অবস্থা খুঁজুন" : "Find donation status"}
          className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="lookup-code" className="text-[13px] font-semibold">
                {bn ? "ট্র্যাকিং কোড / রিসিপ্ট নম্বর" : "Tracking code / receipt number"}
              </Label>
              <Input
                id="lookup-code"
                dir="ltr"
                autoComplete="off"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="DN-2026-000123"
                className="h-12 border-border/80 bg-background font-mono text-[15px] tracking-wide"
              />
            </div>

            <div className="space-y-2.5">
              <p className="text-[13px] font-semibold">{bn ? "যাচাইয়ের মাধ্যম" : "Verify with"}</p>
              <RadioGroup
                value={method}
                onValueChange={(next) => setMethod(next as "phone" | "email")}
                className="grid grid-cols-2 gap-3"
              >
                {(
                  [
                    { value: "phone", icon: Phone, label: bn ? "মোবাইল নম্বর" : "Mobile number" },
                    { value: "email", icon: Mail, label: bn ? "ইমেইল" : "Email" },
                  ] as const
                ).map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`verify-${option.value}`}
                    className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border-2 border-border/70 bg-background px-4 py-2.5 text-[13px] font-medium transition-colors has-[[data-state=checked]]:border-gold has-[[data-state=checked]]:bg-gold/[0.07]"
                  >
                    <RadioGroupItem id={`verify-${option.value}`} value={option.value} className="sr-only" />
                    <option.icon aria-hidden className="h-4 w-4 text-gold" />
                    {option.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {method === "phone" ? (
              <div className="space-y-2">
                <Label htmlFor="lookup-donor-phone" className="text-[13px] font-semibold">
                  {bn ? "মোবাইল নম্বর (ফর্মে যা দিয়েছেন)" : "Mobile number (as on the form)"}
                </Label>
                <Input
                  id="lookup-donor-phone"
                  dir="ltr"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01712345678"
                  className="h-12 border-border/80 bg-background font-mono text-[15px] tracking-wide"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="lookup-donor-email" className="text-[13px] font-semibold">
                  {bn ? "ইমেইল (ফর্মে যা দিয়েছেন)" : "Email (as on the form)"}
                </Label>
                <Input
                  id="lookup-donor-email"
                  dir="ltr"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="donor@example.com"
                  className="h-12 border-border/80 bg-background text-[15px]"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-gold-gradient text-[15px] font-bold text-gold-foreground shadow-md shadow-gold/20 transition-opacity hover:opacity-95"
            >
              {loading ? (
                <Loader2 aria-hidden className="h-5 w-5 animate-spin" />
              ) : (
                <Search aria-hidden className="h-5 w-5" />
              )}
              {bn ? "অবস্থা দেখুন" : "Check status"}
            </Button>
          </div>
        </form>

        {/* error */}
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/[0.06] p-4 text-[13px] leading-relaxed text-destructive"
          >
            <AlertTriangle aria-hidden className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {/* result */}
        {result ? (
          <article aria-live="polite" className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="print-zone bg-card p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-gold/40 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12px] font-bold text-primary">{result.trackingCode}</span>
                  <StatusPill status={result.status} lang={lang} />
                </div>
                <CopyButton value={result.trackingCode} label={bn ? "ট্র্যাকিং কোড" : "tracking code"} lang={lang} />
              </div>

              {/* receipt number — completed only */}
              {result.receiptNo ? (
                <div className="mt-5 rounded-xl border border-dashed border-gold/60 bg-gold/[0.08] p-4 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                    {bn ? "রিসিপ্ট নম্বর" : "Receipt Number"}
                  </p>
                  <div className="mt-1.5 flex items-center justify-center gap-1">
                    <p dir="ltr" className="font-mono text-lg font-bold tracking-wider sm:text-xl">
                      {result.receiptNo}
                    </p>
                    <CopyButton value={result.receiptNo} label={bn ? "রিসিপ্ট নম্বর" : "receipt number"} lang={lang} />
                  </div>
                  {result.paidAt ? (
                    <p className="mt-1 text-[11.5px] text-muted-foreground">
                      {bn ? "পরিশোধ:" : "Paid:"} {formatDate(new Date(result.paidAt), lang)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* summary */}
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border bg-muted/40 p-4 text-[13px]">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {bn ? "ফান্ড" : "Fund"}
                  </dt>
                  <dd className="mt-0.5 font-semibold">{bn ? result.fundName.bn : result.fundName.en}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {bn ? "পরিমাণ" : "Amount"}
                  </dt>
                  <dd className="mt-0.5 text-base font-bold text-primary tabular-nums">
                    {formatAmount(result.amount, result.currency, lang)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {bn ? "দাতার নাম" : "Donor"}
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {result.isAnonymous
                      ? bn
                        ? "গোপন (Anonymous)"
                        : "Anonymous"
                      : result.donorName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {bn ? "তারিখ" : "Date"}
                  </dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 font-semibold">
                    <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
                    {formatDate(new Date(result.createdAt), lang)}
                  </dd>
                </div>
                {result.campaignTitle ? (
                  <div className="col-span-2">
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {bn ? "ক্যাম্পেইন" : "Campaign"}
                    </dt>
                    <dd className="mt-0.5 font-semibold">
                      {bn ? result.campaignTitle.bn : result.campaignTitle.en}
                    </dd>
                  </div>
                ) : null}
                {result.message ? (
                  <div className="col-span-2">
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {bn ? "নোট" : "Note"}
                    </dt>
                    <dd className="mt-0.5 leading-relaxed">{result.message}</dd>
                  </div>
                ) : null}
              </dl>

              {/* pending → manual channels again */}
              {result.status === "PENDING" && result.paymentInfo ? (
                <div className="mt-5">
                  <p className="mb-2.5 flex items-center gap-1.5 text-[12.5px] font-semibold">
                    <ShieldCheck aria-hidden className="h-4 w-4 text-gold" />
                    {bn ? "পেমেন্ট সম্পন্ন করুন যেকোনো একটি মাধ্যমে" : "Complete your payment via any channel"}
                  </p>
                  <ul className="space-y-2">
                    {[
                      { name: "bKash", number: result.paymentInfo.bkash },
                      { name: "Nagad", number: result.paymentInfo.nagad },
                      { name: "Rocket", number: result.paymentInfo.rocket },
                    ]
                      .filter((channel) => channel.number)
                      .map((channel) => (
                        <li
                          key={channel.name}
                          className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                        >
                          <span className="text-[12px] font-semibold text-muted-foreground">{channel.name}</span>
                          <span className="flex items-center gap-1">
                            <span dir="ltr" className="font-mono text-[12.5px] font-semibold">
                              {channel.number}
                            </span>
                            <CopyButton value={channel.number} label={channel.name} lang={lang} />
                          </span>
                        </li>
                      ))}
                    {result.paymentInfo.bank ? (
                      <li className="rounded-lg border px-3 py-2">
                        <span className="text-[12px] font-semibold text-muted-foreground">
                          {bn ? "ব্যাংক" : "Bank"}
                        </span>
                        <p className="mt-0.5 text-[12.5px] leading-snug">{result.paymentInfo.bank}</p>
                      </li>
                    ) : null}
                  </ul>
                  <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
                    {bn
                      ? "পেমেন্টের রেফারেন্সে রিসিপ্ট নম্বর/ট্র্যাকিং কোড উল্লেখ করুন — নিশ্চিত হওয়ার পর এই পৃষ্ঠাতেই রিসিপ্ট চলে আসবে।"
                      : "Mention the receipt/tracking number as the payment reference — once confirmed, the receipt appears right here."}
                  </p>
                </div>
              ) : null}
            </div>

            {/* actions (never printed) */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-6 py-4">
              <p className="text-[12px] text-muted-foreground">
                {bn
                  ? "কোড হারিয়ে গেলে যে মোবাইল/ইমেইলে কনফার্মেশন এসেছিল সেটি দেখুন, অথবা অফিসে যোগাযোগ করুন।"
                  : "Lost the code? Check the confirmation sent to your phone/email, or contact the office."}
              </p>
              {result.status === "COMPLETED" ? (
                <Button
                  type="button"
                  onClick={printReceipt}
                  className="bg-primary font-semibold hover:bg-primary/90"
                >
                  <Printer aria-hidden className="h-4 w-4" />
                  {bn ? "রিসিপ্ট প্রিন্ট করুন" : "Print receipt"}
                </Button>
              ) : null}
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
