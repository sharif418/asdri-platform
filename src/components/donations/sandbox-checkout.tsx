"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck, Star } from "lucide-react";
import { StarMotif, GoldRule } from "@/components/shared/ornaments";
import { toast } from "@/hooks/use-toast";
import { formatAmount, type CurrencyCode } from "./donation-types";
import { langPath } from "@/lib/locale";
import type { Language } from "@/types";

interface SandboxCheckoutProps {
  lang: Language;
  donation: {
    trackingCode: string;
    receiptNo: string;
    fundName: string;
    amount: number;
    currency: string;
    donorName: string;
    isAnonymous: boolean;
  };
  /** Pre-signed gateway payload (the signature is computed server-side). */
  callback: { providerTxnId: string; signature: string };
}

/**
 * The sandbox gateway's checkout island — gateway-styled summary plus the
 * confirm button that submits the server-signed completion payload to
 * /api/donations/callback (the exact contract a real gateway will POST).
 */
export function SandboxCheckout({ lang, donation, callback }: SandboxCheckoutProps) {
  const bn = lang === "bn";
  const [state, setState] = useState<"idle" | "paying" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const amountLabel = formatAmount(donation.amount, donation.currency as CurrencyCode, lang);

  async function onConfirm() {
    if (state === "paying") return;
    setState("paying");
    try {
      const res = await fetch("/api/donations/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingCode: donation.trackingCode,
          status: "COMPLETED",
          providerTxnId: callback.providerTxnId,
          signature: callback.signature,
        }),
      });
      // Public envelope: jsonOk → { data }, jsonError → { error } — no ok flag.
      const json = (await res.json()) as { data?: { status?: string; message?: string }; error?: string };
      if (!res.ok || !json.data) {
        setErrorMessage(json.error ?? (bn ? "পেমেন্ট নিশ্চিত করা যায়নি।" : "Could not confirm the payment."));
        setState("error");
        toast({ title: json.error ?? (bn ? "পেমেন্ট ব্যর্থ হয়েছে" : "Payment failed"), variant: "destructive" });
        return;
      }
      setState("done");
      toast({ title: bn ? "পেমেন্ট সম্পন্ন হয়েছে — আলহামদুলিল্লাহ" : "Payment completed — Jazakallahu Khairan" });
    } catch {
      setErrorMessage(bn ? "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন।" : "Network problem — please try again.");
      setState("error");
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা" : "Network problem", variant: "destructive" });
    }
  }

  if (state === "done") {
    return (
      <section className="container-site flex flex-col items-center px-4 py-16 text-center sm:py-24">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 aria-hidden className="h-9 w-9 text-primary" />
        </span>
        <h1 className="font-heading mt-5 text-2xl font-bold">
          {bn ? "আলহামদুলিল্লাহ! পেমেন্ট সম্পন্ন হয়েছে" : "Payment completed"}
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {bn
            ? "আপনার অনুদান সম্পন্ন হিসেবে নিশ্চিত হয়েছে এবং রিসিপ্ট আপনার ইমেইলে পাঠানো হয়েছে ইনশাআল্লাহ।"
            : "Your donation is confirmed and the receipt has been emailed to you, in shaa Allah."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={langPath(lang, "/support")}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-bold text-gold-foreground shadow-md shadow-gold/20 transition-opacity hover:opacity-95"
          >
            {bn ? "অনুদান পেজে ফিরে যান" : "Back to donations"}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-site px-4 py-12 sm:py-16" aria-label={bn ? "পেমেন্ট চেকআউট" : "Payment checkout"}>
      <div className="mx-auto max-w-lg">
        {/* Gateway header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-emerald-deep p-6 text-ivory">
          <div aria-hidden className="pattern-lattice-light absolute inset-0" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gold">
                <StarMotif className="h-3 w-3" />
                {bn ? "নিরাপদ পেমেন্ট গেটওয়ে" : "Secure Payment Gateway"}
              </p>
              <p className="font-heading mt-1.5 text-lg font-semibold">
                {bn ? "আস-সুন্নাহ ইনস্টিটিউট" : "As-Sunnah Institute"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10.5px] font-bold text-gold">
              <Lock aria-hidden className="h-3 w-3" />
              SANDBOX
            </span>
          </div>
        </div>

        {/* Summary card */}
        <div className="rounded-b-2xl border border-t-0 bg-card p-6 shadow-md sm:p-8">
          <GoldRule className="justify-center" />

          <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {bn ? "পরিশোধের পরিমাণ" : "Amount to pay"}
          </p>
          <p className="font-heading mt-1.5 text-center text-3xl font-bold text-primary">{amountLabel}</p>

          <dl className="mt-6 space-y-3 rounded-xl border bg-muted/40 p-4 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{bn ? "রিসিপ্ট নম্বর" : "Receipt No."}</dt>
              <dd dir="ltr" className="font-mono font-semibold">
                {donation.receiptNo}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{bn ? "ফান্ড" : "Fund"}</dt>
              <dd className="font-semibold">{donation.fundName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{bn ? "দাতার নাম" : "Donor"}</dt>
              <dd className="font-semibold">
                {donation.donorName}
                {donation.isAnonymous ? <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(গোপন)</span> : null}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{bn ? "ট্র্যাকিং কোড" : "Tracking Code"}</dt>
              <dd dir="ltr" className="font-mono font-semibold">
                {donation.trackingCode}
              </dd>
            </div>
          </dl>

          {state === "error" && (
            <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-center text-[12.5px] font-medium text-destructive">
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={state === "paying"}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gold-gradient px-4 py-3.5 text-[15px] font-bold text-gold-foreground shadow-lg shadow-gold/20 transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {state === "paying" ? (
              <>
                <Loader2 aria-hidden className="h-4.5 w-4.5 animate-spin" />
                {bn ? "প্রসেস হচ্ছে…" : "Processing…"}
              </>
            ) : (
              <>
                <CreditCard aria-hidden className="h-4.5 w-4.5" />
                {bn ? "পেমেন্ট কনফার্ম করুন (স্যান্ডবক্স)" : "Confirm payment (sandbox)"}
              </>
            )}
          </button>

          <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[11.5px] leading-relaxed text-muted-foreground">
            <ShieldCheck aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/80" />
            {bn
              ? "স্যান্ডবক্স পরিবেশ — কোনো আসল টাকা কাটবে না। বাস্তব গেটওয়ে যুক্ত হলে এই ধাপটি সেটিই হবে।"
              : "Sandbox environment — no real money moves. A real gateway replaces this step in production."}
          </p>
        </div>

        <p className="mt-4 text-center text-[11.5px] text-muted-foreground">
          <Star aria-hidden className="mr-1 inline h-3 w-3 text-gold/70" />
          {bn
            ? "সমস্যা হলে ম্যানুয়াল মাধ্যমেও পেমেন্ট করতে পারেন — রিসিপ্ট ডায়ালগে নম্বরগুলো আছে।"
            : "You may also pay manually via the channels shown in your receipt dialog."}
        </p>
      </div>
    </section>
  );
}
