import type { Metadata } from "next";
import Link from "next/link";
import { createHmac, timingSafeEqual } from "node:crypto";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { alternatesFor, isLang, langPath, type Lang } from "@/lib/locale";
import { getSiteConfig } from "@/lib/content/site";
import { SandboxCheckout } from "@/components/donations/sandbox-checkout";

export const dynamic = "force-dynamic";

interface CheckoutPageProps {
  params: Promise<{ lang: string; code: string }>;
  searchParams: Promise<{ sig?: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { lang: raw, code } = await params;
  const lang: Lang = isLang(raw) ? raw : "bn";
  const isBn = lang === "bn";
  const siteConfig = await getSiteConfig();
  const { canonical, languages } = alternatesFor(`/checkout/${code}`, env.siteUrl);
  return {
    title: isBn ? `পেমেন্ট চেকআউট — ${siteConfig.shortBn}` : `Payment Checkout — ${siteConfig.shortEn}`,
    description: isBn
      ? "নিরাপদ স্যান্ডবক্স পেমেন্ট গেটওয়ে — আপনার অনুদানের ট্র্যাকিং কোড ও স্বাক্ষর যাচাই করে পেমেন্ট সম্পন্ন করুন।"
      : "Secure sandbox payment gateway — complete your donation after tracking-code and link-signature verification.",
    alternates: { canonical, languages },
    robots: { index: false, follow: false },
  };
}

/** Timing-safe hex-HMAC comparison (mirrors the callback route's check). */
function signatureValid(code: string, given: string | undefined): boolean {
  if (!given || !/^[0-9a-fA-F]{64}$/.test(given)) return false;
  const expected = createHmac("sha256", env.paymentCallbackSecret).update(code).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given.toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The sandbox payment-gateway page: the receipt dialog links here with
 * `?sig=<hex HMAC-SHA256(PAYMENT_CALLBACK_SECRET, trackingCode)>` (the URL
 * signature is computed by POST /api/donations — see its comment). This page
 * acts as the gateway: it verifies the link signature timing-safely, then —
 * like a real gateway server — signs the completion callback itself with the
 * exact contract the callback route expects:
 *   signature = hex HMAC-SHA256(secret, `${trackingCode}|COMPLETED|${providerTxnId}`)
 * The client island only submits that pre-signed payload; the secret never
 * reaches the browser beyond the two single-purpose signatures.
 */
export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { lang: raw, code } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const bn = lang === "bn";
  const { sig } = await searchParams;

  const backToSupport = (
    <Link
      href={langPath(lang, "/support")}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
    >
      {bn ? "অনুদান পেজে ফিরে যান" : "Back to donations"}
    </Link>
  );

  // Invalid or missing link signature → polite error, never a stack trace.
  if (!signatureValid(code, sig)) {
    return (
      <section className="container-site flex flex-col items-center px-4 py-20 text-center sm:py-28">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle aria-hidden className="h-7 w-7 text-destructive" />
        </span>
        <h1 className="font-heading mt-5 text-xl font-bold sm:text-2xl">
          {bn ? "লিংকটি সঠিক নয়" : "This link is not valid"}
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {bn
            ? "পেমেন্ট লিংকের স্বাক্ষর যাচাই হয়নি — সম্ভবত লিংকটি সম্পূর্ণ নয় বা মেয়াদ শেষ। অনুদান ফর্ম থেকে আবার শুরু করুন।"
            : "The payment link's signature could not be verified — it may be truncated or expired. Please start again from the donation form."}
        </p>
        <div className="mt-6">{backToSupport}</div>
      </section>
    );
  }

  const donation = await db.donation.findUnique({
    where: { trackingCode: code },
    include: { fund: { select: { nameBn: true, nameEn: true } } },
  });
  if (!donation) {
    return (
      <section className="container-site flex flex-col items-center px-4 py-20 text-center sm:py-28">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15">
          <ShieldCheck aria-hidden className="h-7 w-7 text-gold" />
        </span>
        <h1 className="font-heading mt-5 text-xl font-bold sm:text-2xl">
          {bn ? "অনুদানটি খুঁজে পাওয়া যায়নি" : "Donation not found"}
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {bn
            ? "এই ট্র্যাকিং কোডে কোনো অনুদান রেকর্ড নেই।"
            : "No donation is recorded against this tracking code."}
        </p>
        <div className="mt-6">{backToSupport}</div>
      </section>
    );
  }

  // Only a PENDING intent is payable here.
  if (donation.status !== "PENDING") {
    const statusBn: Record<string, string> = {
      COMPLETED: bn ? "পেমেন্ট ইতিমধ্যেই সম্পন্ন হয়েছে — আলহামদুলিল্লাহ।" : "This payment is already completed — Jazakallahu Khairan.",
      FAILED: bn ? "এই অনুদানটি ব্যর্থ হিসেবে চিহ্নিত হয়েছে।" : "This donation was marked as failed.",
      REFUNDED: bn ? "এই অনুদানটি ফেরত দেওয়া হয়েছে।" : "This donation has been refunded.",
    };
    return (
      <section className="container-site flex flex-col items-center px-4 py-20 text-center sm:py-28">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck aria-hidden className="h-7 w-7 text-primary" />
        </span>
        <h1 className="font-heading mt-5 text-xl font-bold sm:text-2xl">
          {bn ? "এই পেমেন্টের আর কিছু করার নেই" : "Nothing left to do for this payment"}
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {statusBn[donation.status] ?? donation.status}
        </p>
        <div className="mt-6">{backToSupport}</div>
      </section>
    );
  }

  // The gateway signs the completion callback exactly like the callback route
  // verifies it: HMAC-SHA256 over `${trackingCode}|COMPLETED|${providerTxnId}`.
  const providerTxnId = `SBX-${donation.trackingCode}`;
  const callbackSignature = createHmac("sha256", env.paymentCallbackSecret)
    .update(`${donation.trackingCode}|COMPLETED|${providerTxnId}`)
    .digest("hex");

  return (
    <SandboxCheckout
      lang={lang}
      donation={{
        trackingCode: donation.trackingCode,
        receiptNo: donation.receiptNo ?? donation.trackingCode,
        fundName: bn ? donation.fund.nameBn : donation.fund.nameEn || donation.fund.nameBn,
        amount: donation.amount,
        currency: donation.currency,
        donorName: donation.donorName,
        isAnonymous: donation.isAnonymous,
      }}
      callback={{ providerTxnId, signature: callbackSignature }}
    />
  );
}
