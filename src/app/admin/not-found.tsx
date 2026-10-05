import Link from "next/link";
import { ArrowLeft, LayoutDashboard, SearchX } from "lucide-react";
import { StarMotif } from "@/components/shared/ornaments";
import { InstituteLogo } from "@/components/shared/logo";

/**
 * Admin 404 — branded not-found for the /admin tree (logged-in staff only;
 * anonymous visitors are redirected to /login by the admin root layout
 * before any page renders). Triggered by the admin catch-all route or by
 * notFound() from an admin module (e.g. a deleted course id). Bilingual:
 * Bengali primary, English secondary. Static markup only.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border bg-card text-center shadow-sm">
        <div className="relative bg-emerald-deep px-6 pb-8 pt-10 text-ivory">
          <div aria-hidden className="pattern-lattice-light absolute inset-0" />
          <div className="relative flex flex-col items-center">
            <InstituteLogo tone="on-dark" className="h-12 w-12" />
            <div className="mt-5 flex items-center gap-3">
              <span aria-hidden className="h-px w-10 bg-gold/60" />
              <StarMotif className="h-3.5 w-3.5 text-gold" />
              <span aria-hidden className="h-px w-10 bg-gold/60" />
            </div>
            <p className="font-heading mt-4 text-5xl font-semibold text-gold-gradient sm:text-6xl" dir="ltr">
              ৪০৪
            </p>
            <h1 className="font-heading mt-2 text-xl font-semibold sm:text-2xl">পৃষ্ঠাটি পাওয়া যায়নি</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-ivory/70" lang="en">
              This admin page doesn&apos;t exist or has moved.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <SearchX aria-hidden className="h-4 w-4 text-gold" />
            যে মডিউলটি খুঁজছেন সেটি সরানো হয়েছে, অথবা লিংকটি ভুল।
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <LayoutDashboard aria-hidden className="h-4 w-4" />
              ড্যাশবোর্ডে ফিরে যান
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              পাবলিক সাইটে যান
            </Link>
          </div>
        </div>

        <div aria-hidden className="h-1 bg-gold-gradient" />
      </div>
    </div>
  );
}
