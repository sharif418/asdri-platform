"use client";

import { useState } from "react";
import { CalendarDays, Check, CheckCircle2, Copy, MailCheck, Repeat, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";
import { FUND_LABELS, formatAmount, type ReceiptData } from "./donation-types";
import type { Language } from "@/types";

interface ReceiptDialogProps {
  receipt: ReceiptData | null;
  lang: Language;
  onClose: () => void;
}

function CopyButton({ value, label, lang }: { value: string; label: string; lang: Language }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: lang === "bn" ? "কপি হয়েছে" : "Copied" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: lang === "bn" ? "কপি করা যায়নি" : "Could not copy", variant: "destructive" });
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={`${lang === "bn" ? "কপি করুন" : "Copy"} ${label}`}
    >
      {copied ? <Check aria-hidden className="h-3.5 w-3.5 text-emerald-600" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
      <span className="sr-only">{lang === "bn" ? "কপি করুন" : "Copy"}</span>
    </button>
  );
}

/** Success dialog shown after a donation intent is created: receipt + payment instructions. */
export function ReceiptDialog({ receipt, lang, onClose }: ReceiptDialogProps) {
  const bn = lang === "bn";
  const open = receipt !== null;

  const channels = receipt
    ? [
        { name: "bKash", number: receipt.paymentInfo.bkash },
        { name: "Nagad", number: receipt.paymentInfo.nagad },
        { name: "Rocket", number: receipt.paymentInfo.rocket },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="scrollbar-thin max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {receipt ? (
          <>
            <DialogHeader className="items-center text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/10">
                <CheckCircle2 aria-hidden className="h-8 w-8 text-emerald-600" />
              </span>
              <DialogTitle className="font-heading text-xl">
                {bn ? "জাযাকাল্লাহু খাইরান!" : "Jazakallahu Khairan!"}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed">
                {receipt.message}
              </DialogDescription>
            </DialogHeader>

            {/* Receipt number */}
            <div className="rounded-xl border border-dashed border-gold/60 bg-gold/[0.08] p-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                {bn ? "রিসিপ্ট নম্বর" : "Receipt Number"}
              </p>
              <div className="mt-1.5 flex items-center justify-center gap-1">
                <p dir="ltr" className="font-mono text-lg font-bold tracking-wider sm:text-xl">
                  {receipt.receiptNo}
                </p>
                <CopyButton value={receipt.receiptNo} label={bn ? "রিসিপ্ট নম্বর" : "receipt number"} lang={lang} />
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                {bn
                  ? "পেমেন্টের সময় রেফারেন্সে এই নম্বরটি অবশ্যই উল্লেখ করুন"
                  : "Please mention this number as the payment reference"}
              </p>
            </div>

            {/* Donation summary */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border bg-muted/40 p-4 text-[13px]">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {bn ? "ফান্ড" : "Fund"}
                </dt>
                <dd className="mt-0.5 font-semibold">{FUND_LABELS[receipt.fundType][lang]}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {bn ? "পরিমাণ" : "Amount"}
                </dt>
                <dd className="mt-0.5 text-base font-bold text-primary">
                  {formatAmount(receipt.amount, receipt.currency, lang)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {bn ? "দাতার নাম" : "Donor"}
                </dt>
                <dd className="mt-0.5 font-semibold">
                  {receipt.anonymous ? "Anonymous" : receipt.donorName}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {bn ? "তারিখ" : "Date"}
                </dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-semibold">
                  <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
                  {formatDate(receipt.createdAt, lang)}
                </dd>
              </div>
              {receipt.recurring ? (
                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11.5px] font-semibold text-gold">
                    <Repeat aria-hidden className="h-3.5 w-3.5" />
                    {bn ? "মাসিক অটো-ডোনেশন চালু হবে" : "Monthly auto-donation enabled"}
                  </span>
                </div>
              ) : null}
            </dl>

            {/* Payment instructions */}
            <div>
              <p className="mb-2.5 flex items-center gap-1.5 text-[12.5px] font-semibold">
                <ShieldCheck aria-hidden className="h-4 w-4 text-gold" />
                {bn ? "পেমেন্ট সম্পন্ন করুন যেকোনো একটি মাধ্যমে" : "Complete your payment via any channel"}
              </p>
              <ul className="space-y-2">
                {channels.map((channel) => (
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
                <li className="rounded-lg border px-3 py-2">
                  <span className="text-[12px] font-semibold text-muted-foreground">
                    {bn ? "ব্যাংক" : "Bank"}
                  </span>
                  <p className="mt-0.5 text-[12.5px] leading-snug">{receipt.paymentInfo.bank}</p>
                </li>
              </ul>
            </div>

            <p className="flex items-start gap-2 rounded-lg bg-primary/[0.06] p-3 text-[12px] leading-relaxed text-muted-foreground">
              <MailCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {bn
                ? "পেমেন্ট নিশ্চিত হওয়ার পর আপনার ডিজিটাল রিসিপ্ট ইমেইলে পাঠানো হবে ইনশাআল্লাহ।"
                : "Once the payment is confirmed, your digital receipt will be emailed to you, in shaa Allah."}
              {receipt.anonymous
                ? bn
                  ? " আপনার নাম প্রকাশ্য তালিকায় “Anonymous” হিসেবে দেখানো হবে।"
                  : " Your name will appear as “Anonymous” in public lists."
                : ""}
            </p>

            <DialogFooter className="sm:justify-center">
              <Button type="button" onClick={onClose} className="bg-primary font-semibold hover:bg-primary/90">
                {bn ? "ঠিক আছে" : "Done"}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
