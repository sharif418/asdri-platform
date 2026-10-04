"use client";

import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarMotif } from "@/components/shared/ornaments";
import { InstituteLogo } from "@/components/shared/logo";
import { useLanguage } from "@/components/providers/language-provider";
import { langPath } from "@/lib/locale";

/** Site-group 404 — branded, bilingual. */
export default function SiteNotFound() {
  const { lang } = useLanguage();

  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-emerald-deep px-4 py-20 text-center text-ivory">
      <div aria-hidden className="pattern-lattice-light absolute inset-0" />
      <div className="relative flex flex-col items-center">
        <InstituteLogo tone="on-dark" className="h-16 w-16" />
        <div className="mt-8 flex items-center gap-3">
          <span aria-hidden className="h-px w-12 bg-gold/60" />
          <StarMotif className="h-4 w-4 text-gold" />
          <span aria-hidden className="h-px w-12 bg-gold/60" />
        </div>
        <p className="font-heading mt-6 text-6xl font-semibold text-gold-gradient sm:text-7xl">৪০৪</p>
        <h1 className="font-heading mt-3 text-2xl font-semibold sm:text-3xl">
          পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ivory/70 sm:text-base">
          দুঃখিত, আপনি যে পৃষ্ঠাটি খুঁজছেন তা স্থানান্তরিত বা অস্তিত্বহীন হতে পারে।
          <span className="block pt-1 text-ivory/50">
            Sorry, the page you are looking for might have been moved or does not exist.
          </span>
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-gold-gradient font-semibold text-gold-foreground hover:opacity-95">
            <Link href={langPath(lang, "/")}>
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
            <Link href={langPath(lang, "/notices")}>
              <Compass aria-hidden className="h-4 w-4" />
              নোটিশ বোর্ড
            </Link>
          </Button>
        </div>
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gold-gradient" />
    </div>
  );
}
