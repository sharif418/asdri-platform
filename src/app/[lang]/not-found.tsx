import Link from "next/link";
import { Home, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarMotif } from "@/components/shared/ornaments";
import { InstituteLogo } from "@/components/shared/logo";

/**
 * Public 404 — the single not-found boundary for the whole [lang] tree.
 *
 * Sits directly under the site root layout (NOT inside the (site) group):
 * Next 16 only honors a not-found boundary at this level for this app — the
 * old `(site)/not-found.tsx` never rendered, and `(site)/loading.tsx` flushed
 * the shell early which turned every 404 into a 200. When notFound() unwinds
 * here the (site) header/footer are replaced by this standalone full-screen
 * panel, so it carries its own emerald/gold/ivory branding. A static server
 * component (no hooks, no data fetching) so the branded markup is in the very
 * first HTML byte — crawlers and no-JS visitors see it, not just browsers.
 * Bilingual by design: Bengali primary, English secondary, one link to each
 * language's home.
 */
export default function LangNotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-emerald-deep px-4 py-20 text-center text-ivory">
      <div aria-hidden className="pattern-lattice-light absolute inset-0" />
      <div className="relative flex flex-col items-center">
        <InstituteLogo tone="on-dark" className="h-16 w-16" />
        <div className="mt-8 flex items-center gap-3">
          <span aria-hidden className="h-px w-12 bg-gold/60" />
          <StarMotif className="h-4 w-4 text-gold" />
          <span aria-hidden className="h-px w-12 bg-gold/60" />
        </div>
        <p className="font-heading mt-6 text-6xl font-semibold text-gold-gradient sm:text-7xl" dir="ltr">
          ৪০৪
        </p>
        <h1 className="font-heading mt-3 text-2xl font-semibold sm:text-3xl">পৃষ্ঠাটি খুঁজে পাওয়া যায়নি</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ivory/70 sm:text-base">
          দুঃখিত, আপনি যে পৃষ্ঠাটি খুঁজছেন তা স্থানান্তরিত বা অস্তিত্বহীন হতে পারে।
          <span className="block pt-1 text-ivory/50" lang="en">
            Sorry, the page you are looking for might have been moved or does not exist.
          </span>
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-gold-gradient font-semibold text-gold-foreground hover:opacity-95">
            <Link href="/">
              <Home aria-hidden className="h-4 w-4" />
              হোমে ফিরে যান
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="border border-ivory/25 bg-white/10 text-ivory backdrop-blur hover:bg-white/15"
          >
            <Link href="/en" lang="en">
              <Languages aria-hidden className="h-4 w-4" />
              Go to English site
            </Link>
          </Button>
        </div>
        <p className="mt-10 text-[11px] tracking-wide text-ivory/50">
          আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট · As-Sunnah Dawah &amp; Research Institute
        </p>
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gold-gradient" />
    </div>
  );
}
