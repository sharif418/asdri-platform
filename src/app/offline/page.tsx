import type { Metadata } from "next";
import { ArrowLeft, WifiOff } from "lucide-react";
import { Bismillah, StarMotif } from "@/components/shared/ornaments";
import { InstituteLogo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "অফলাইন — Offline",
  description: "আপনি এখন অফলাইনে আছেন — ইন্টারনেট সংযোগ ফিরে পেয়ে আবার চেষ্টা করুন।",
  robots: { index: false, follow: false },
};

/**
 * Offline fallback served by the service worker when a navigation fails and
 * no cached copy exists. Deliberately minimal — server-rendered, no client
 * components, plain anchors — so it renders correctly even with zero JS
 * chunks available offline.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <InstituteLogo className="h-14 w-14" />
      <Bismillah className="h-6 w-auto text-gold" />
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold">
        <WifiOff aria-hidden className="h-7 w-7" />
      </span>
      <div className="max-w-md space-y-2">
        <h1 className="font-heading text-2xl font-bold">
          আপনি এখন অফলাইনে আছেন
        </h1>
        <p className="text-sm text-muted-foreground">
          You are offline. ইন্টারনেট সংযোগ ফিরে পেয়ে আবার চেষ্টা করুন — পূর্বে দেখা পাতাগুলো এখনো
          ক্যাশে সংরক্ষিত থাকতে পারে।
        </p>
      </div>
      <StarMotif className="h-8 w-auto text-gold/70" />
      <a
        href="/"
        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        হোমে ফিরে যান
      </a>
    </div>
  );
}
