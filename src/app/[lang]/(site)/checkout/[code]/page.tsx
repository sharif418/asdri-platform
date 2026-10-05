import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { grantValid, isSandboxProvider } from "@/lib/payments";
import { langPath, isLang, type Lang } from "@/lib/locale";
import { SandboxCheckout } from "@/components/donations/sandbox-checkout";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; code: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  return {
    title: isBn ? "পেমেন্ট চেকআউট" : "Payment Checkout",
    robots: { index: false, follow: false },
  };
}

interface CheckoutPageProps {
  params: Promise<{ lang: string; code: string }>;
  searchParams: Promise<{ sig?: string; exp?: string }>;
}

/**
 * The sandbox payment-gateway page (dev/demo only — it 404s unless the
 * provider is explicitly sandbox, and production refuses that provider at
 * boot). The receipt dialog links here with
 * `?sig=<hex HMAC-SHA256(secret, `${code}|${exp}`)>&exp=<epoch-seconds>`;
 * the grant expires (24h) and is verified timing-safely below. Confirming
 * POSTs only the tracking code to /api/donations/sandbox-complete — the
 * completion signature is computed server-side and never rendered.
 */
export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { lang: raw, code } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const bn = lang === "bn";
  const { sig, exp } = await searchParams;

  // Anything but the sandbox provider: this page does not exist.
  if (!isSandboxProvider()) notFound();

  const backToSupport = (
    <Link
      href={langPath(lang, "/support")}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
    >
      {bn ? "অনুদান পেজে ফিরে যান" : "Back to donations"}
    </Link>
  );

  // Invalid, missing or EXPIRED link signature → polite error, never a stack trace.
  if (!grantValid(code, sig, exp)) {
    return (
      <section className="container-site flex flex-col items-center px-4 py-20 text-center sm:py-28">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle aria-hidden className="h-7 w-7 text-destructive" />
        </span>
        <h1 className="font-heading mt-5 text-xl font-bold sm:text-2xl">
          {bn ? "লিংকটি সঠিক নয় বা মেয়াদ শেষ" : "This link is not valid or has expired"}
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {bn
            ? "পেমেন্ট লিংকের স্বাক্ষর যাচাই হয়নি — সম্ভবত লিংকটি সম্পূর্ণ নয় বা মেয়াদ (২৪ ঘণ্টা) শেষ। অনুদান ফর্ম থেকে আবার শুরু করুন।"
            : "The payment link's signature could not be verified — it may be truncated or past its 24-hour validity. Please start again from the donation form."}
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
    />
  );
}
