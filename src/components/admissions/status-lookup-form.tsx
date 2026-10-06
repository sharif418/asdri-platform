"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, BadgeCheck, Compass, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTrack, STATUS_GUIDANCE, statusLabel } from "@/components/admissions/status-track";
import { langPath } from "@/lib/locale";
import { formatDate } from "@/lib/format";
import type { Lang } from "@/lib/locale";
import type { ApplicationStatus } from "@prisma/client";

interface LookupResult {
  trackingNo: string;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
  applicantName: string;
  course: { code: string; titleBn: string; titleEn: string };
  intakeYear: number;
  events: { status: ApplicationStatus; at: string }[];
}

interface StatusLookupFormProps {
  lang: Lang;
}

/**
 * Client island for /admissions/status — public application status check.
 * POSTs {trackingNo, phone} to /api/admissions/status-lookup; the API is the
 * sole gatekeeper (anti-enumeration, rate limit) — this component only
 * renders what it is given.
 */
export function StatusLookupForm({ lang }: StatusLookupFormProps) {
  const bn = lang === "bn";
  const [trackingNo, setTrackingNo] = useState("");
  const [phone, setPhone] = useState("");
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
      const res = await fetch("/api/admissions/status-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNo: trackingNo.trim(), phone: phone.trim(), lang }),
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

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-12">
      {/* ————— how it works ————— */}
      <aside className="rounded-2xl border border-gold/30 bg-gold/[0.05] p-6 sm:p-8">
        <h2 className="font-heading flex items-center gap-2 text-lg font-bold">
          <Compass aria-hidden className="h-5 w-5 text-gold" />
          {bn ? "কীভাবে কাজ করে" : "How it works"}
        </h2>
        <ol className="mt-5 space-y-4">
          {(bn
            ? [
                "আবেদন জমা দেওয়ার সময় আপনি একটি ট্র্যাকিং নম্বর পেয়েছেন (যেমন ASDRI-2026-123456)।",
                "সেই নম্বরটি আর আবেদনে ব্যবহৃত মোবাইল নম্বর লিখুন।",
                "ভর্তির প্রতিটি ধাপ আপডেট হওয়ার সাথে সাথেই এখানে দেখতে পাবেন।",
              ]
            : [
                "You received a tracking number when you submitted (e.g. ASDRI-2026-123456).",
                "Enter that number together with the mobile number used on the application.",
                "Every stage of the admission process shows up here as it is updated.",
              ]
          ).map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[12px] font-bold text-gold"
              >
                {bn ? "০১২৩৪৫"[i] : i + 1}
              </span>
              <p className="pt-1 text-[13.5px] leading-relaxed text-muted-foreground">{step}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 border-t border-gold/20 pt-4 text-[12.5px] leading-relaxed text-muted-foreground">
          {bn
            ? "লগইন ছাড়াই যেকোনো ডিভাইস থেকে দেখা যায়। আবেদন করে থাকলে আপনার অ্যাকাউন্ট পেজেও একই তথ্য পাবেন।"
            : "Works from any device without logging in. If you applied online, your account page shows the same information."}
        </p>
      </aside>

      {/* ————— form + result ————— */}
      <div className="space-y-6">
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label={bn ? "আবেদনের অবস্থা খুঁজুন" : "Find application status"}
          className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="lookup-tracking" className="text-[13px] font-semibold">
                {bn ? "ট্র্যাকিং নম্বর" : "Tracking number"}
              </Label>
              <Input
                id="lookup-tracking"
                dir="ltr"
                autoComplete="off"
                required
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value.toUpperCase())}
                placeholder="ASDRI-2026-123456"
                className="h-12 border-border/80 bg-background font-mono text-[15px] tracking-wide"
              />
              <p className="text-[11.5px] text-muted-foreground">
                {bn ? "আবেদন জমার পর প্রদর্শিত নম্বরটি" : "The number shown after you submitted"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lookup-phone" className="text-[13px] font-semibold">
                {bn ? "মোবাইল নম্বর (আবেদনে যা দিয়েছেন)" : "Mobile number (as on the application)"}
              </Label>
              <Input
                id="lookup-phone"
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
              <p className="text-[11.5px] text-muted-foreground">
                {bn
                  ? "শুধুমাত্র আবেদনে ব্যবহৃত নম্বরের সাথে মিললে ফলাফল দেখানো হবে"
                  : "Results appear only when this matches the number on the application"}
              </p>
            </div>

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
          <article
            aria-live="polite"
            className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeCheck aria-hidden className="h-4.5 w-4.5 text-primary" />
                  <span className="font-mono text-[12px] font-bold text-primary">{result.trackingNo}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      result.status === "ADMITTED"
                        ? "bg-primary text-primary-foreground"
                        : result.status === "REJECTED"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-gold/15 text-gold"
                    }`}
                  >
                    {statusLabel(result.status, lang)}
                  </span>
                </div>
                <h3 className="font-heading mt-2.5 text-lg font-bold leading-snug">
                  {bn ? result.course.titleBn : result.course.titleEn || result.course.titleBn}
                </h3>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {bn ? "জমা:" : "Submitted:"} {formatDate(new Date(result.submittedAt), lang)}
                </p>
              </div>
            </div>

            <StatusTrack
              status={result.status}
              lang={lang}
              events={result.events.map((e) => ({ status: e.status, at: e.at }))}
            />

            {STATUS_GUIDANCE[result.status].bn ? (
              <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-primary/[0.06] p-4 text-[13px] leading-relaxed text-foreground/90">
                <Compass aria-hidden className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
                {bn ? STATUS_GUIDANCE[result.status].bn : STATUS_GUIDANCE[result.status].en}
              </p>
            ) : null}

            <p className="mt-5 border-t pt-4 text-[12px] leading-relaxed text-muted-foreground">
              {bn
                ? "নম্বর হারিয়ে ফেলেছেন? আবেদনের সময় যে মোবাইল নম্বর দিয়েছিলেন সেখানে কনফার্মেশন এসএমএস/তথ্য রয়েছে, অথবা ভর্তি অফিসে যোগাযোগ করুন।"
                : "Lost the number? Check the confirmation sent to the mobile number used on the application, or contact the admission office."}{" "}
              <Link
                href={langPath(lang, "/admissions/faq")}
                className="font-semibold text-primary underline decoration-gold/50 underline-offset-4 hover:decoration-gold"
              >
                {bn ? "সচরাচর জিজ্ঞাসা" : "FAQ"}
              </Link>
            </p>
          </article>
        ) : null}
      </div>
    </div>
  );
}
