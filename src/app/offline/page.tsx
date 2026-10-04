import type { Metadata } from "next";
import { ArrowLeft, WifiOff } from "lucide-react";
import { getLang } from "@/lib/i18n-server";
import { Bismillah, StarMotif } from "@/components/shared/ornaments";
import { InstituteLogo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "অফলাইন — Offline",
  description: "আপনি এখন অফলাইনে আছেন — ইন্টারনেট সংযোগ ফিরে পেয়ে আবার চেষ্টা করুন।",
  robots: { index: false, follow: false },
};

/**
 * Offline fallback served by the service worker (public/sw.js) when a
 * navigation fails and no cached copy exists. Deliberately minimal —
 * server-rendered, no client components, plain anchors — so it renders
 * correctly even with zero JS chunks available offline.
 */
export default async function OfflinePage() {
  const lang = await getLang();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-emerald-deep px-4 py-16 text-center text-ivory">
      <div aria-hidden className="pattern-lattice-light absolute inset-0" />
      <div className="relative flex w-full max-w-xl flex-col items-center">
        <InstituteLogo tone="on-dark" className="h-16 w-16" />

        <div className="mt-8 flex items-center gap-3">
          <span aria-hidden className="h-px w-12 bg-gold/60" />
          <StarMotif className="h-4 w-4 text-gold" />
          <span aria-hidden className="h-px w-12 bg-gold/60" />
        </div>

        <Bismillah className="mt-6 text-gold/90" />

        <div
          aria-hidden
          className="mt-8 flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-white/10"
        >
          <WifiOff className="h-7 w-7 text-gold" />
        </div>

        <h1 className="font-heading mt-6 text-2xl font-semibold sm:text-3xl">
          {lang === "bn" ? "আপনি এখন অফলাইনে আছেন" : "You are now offline"}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ivory/70 sm:text-base">
          {lang === "bn"
            ? "ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। সংযোগ ফিরে পেলে আবার চেষ্টা করুন — ততক্ষণ পর্যন্ত এই পৃষ্ঠাটি দেখা যাবে।"
            : "No internet connection detected. Please check your connection and try again."}
          <span className="block pt-1 text-ivory/50">
            {lang === "bn"
              ? "This page was served from your device's offline cache."
              : "এই পৃষ্ঠাটি আপনার ডিভাইসের অফলাইন ক্যাশ থেকে দেখানো হয়েছে।"}
          </span>
        </p>

        {/* Plain anchor (not a client-side Link) so the retry works even
            when no JS chunks could be fetched offline. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gold-gradient px-8 font-semibold text-gold-foreground transition-opacity hover:opacity-95"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            {lang === "bn" ? "আবার চেষ্টা করুন" : "Try again"}
          </a>
          <a
            href="/notices"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ivory/25 bg-white/10 px-8 font-medium text-ivory backdrop-blur transition-colors hover:bg-white/15"
          >
            {lang === "bn" ? "নোটিশ বোর্ড" : "Notice board"}
          </a>
        </div>

        <p className="mt-10 text-[11px] uppercase tracking-[0.22em] text-gold/70">
          {lang === "bn" ? "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট" : "As-Sunnah Dawah & Research Institute"}
        </p>
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gold-gradient" />
    </main>
  );
}
