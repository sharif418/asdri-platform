"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download, ExternalLink, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bismillah, StarMotif } from "@/components/shared/ornaments";
import { siteConfig } from "@/content/site";
import { useLanguage } from "@/components/providers/language-provider";
import { langPath } from "@/lib/locale";
import type { Language } from "@/types";
import { pick } from "@/types";

interface HeroProps {
  lang: Language;
}

/** Full-bleed hero — campus backdrop, bismillah, headline, dual CTAs, video dialog. */
export function Hero({ lang }: HeroProps) {
  const { t } = useLanguage();
  const [videoOpen, setVideoOpen] = useState(false);

  const copy = {
    overline:
      lang === "bn"
        ? "দাওয়াহ • শিক্ষা • গবেষণা"
        : "DAWAH • EDUCATION • RESEARCH",
    subHeading: lang === "bn" ? siteConfig.parentBn : siteConfig.parentEn,
    tagline: lang === "bn" ? siteConfig.taglineBn : siteConfig.taglineEn,
  };

  return (
    <section className="texture-grain relative isolate overflow-hidden bg-emerald-deep text-ivory">
      {/* Backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url('/images/hero-campus.png')] bg-cover bg-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-deep/95 via-emerald-deep/80 to-emerald-deep/95"
      />
      <div aria-hidden className="pattern-lattice-light absolute inset-0 -z-10 opacity-50" />

      <div className="container-site relative flex flex-col items-center py-20 text-center sm:py-28 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          <Bismillah className="text-gold/90" />
          <p className="mt-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/90 sm:text-xs">
            <span aria-hidden className="h-px w-10 bg-gold/60" />
            {copy.overline}
            <span aria-hidden className="h-px w-10 bg-gold/60" />
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.15] sm:text-5xl lg:text-6xl"
        >
          {lang === "bn" ? (
            <>
              আস-সুন্নাহ <span className="text-gold-gradient">দাওয়াহ অ্যান্ড রিসার্চ</span> ইনস্টিটিউট
            </>
          ) : (
            <>
              As-Sunnah <span className="text-gold-gradient">Dawah & Research</span> Institute
            </>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-base font-medium leading-relaxed tracking-wide text-gold sm:text-lg"
        >
          {copy.subHeading}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-balance text-[15px] leading-[1.75] text-ivory/80 sm:text-lg"
        >
          {copy.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="bg-gold-gradient min-w-[220px] text-[15px] font-semibold text-gold-foreground shadow-lg shadow-black/20 hover:opacity-95"
          >
            <Link href={langPath(lang, "/academics/courses")}>
              <Sparkles aria-hidden className="h-4.5 w-4.5" />
              {t("action.exploreCourses")}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="min-w-[220px] border border-ivory/40 bg-white/10 text-[15px] font-medium text-ivory backdrop-blur hover:bg-white/15"
          >
            <Link href={langPath(lang, "/academics/downloads")}>
              <Download aria-hidden className="h-4.5 w-4.5" />
              {t("action.downloadProspectus")}
            </Link>
          </Button>
        </motion.div>

        {/* Intro video trigger */}
        <motion.button
          type="button"
          onClick={() => setVideoOpen(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="group mt-12 flex flex-col items-center gap-3"
          aria-label={lang === "bn" ? "পরিচিতিমূলক ভিডিও দেখুন" : "Watch the introductory video"}
        >
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gold/50 bg-white/10 backdrop-blur transition-all group-hover:scale-105 group-hover:border-gold group-hover:bg-white/20">
            <span
              aria-hidden
              className="absolute inset-0 animate-ping rounded-full border border-gold/40"
              style={{ animationDuration: "2.4s" }}
            />
            <Play aria-hidden className="h-6 w-6 fill-gold text-gold" />
          </span>
          <span className="text-sm font-medium text-ivory/85 transition-colors group-hover:text-gold">
            {lang === "bn" ? "পরিচিতিমূলক ভিডিও দেখুন" : "Watch Introductory Video"}
          </span>
        </motion.button>
      </div>

      {/* Bottom fade into page */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gold-gradient" />

      {/* Video dialog */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="max-w-lg border-emerald-800/40 bg-emerald-deep text-ivory sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2 text-left text-lg">
              <StarMotif className="h-4 w-4 text-gold" />
              {lang === "bn" ? "ইনস্টিটিউট পরিচিতি" : "About the Institute"}
            </DialogTitle>
            <DialogDescription className="text-left text-ivory/75">
              {lang === "bn"
                ? "ক্যাম্পাস লাইফ, দাওয়াহ কার্যক্রম ও ইনস্টিটিউটের লক্ষ্য নিয়ে আমাদের অফিসিয়াল ভিডিওগুলো দেখুন।"
                : "Watch our official videos showcasing campus life, dawah activities, and the institute's vision."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full overflow-hidden rounded-lg border border-gold/30">
              <img
                src="/images/campus-seminar.png"
                alt={lang === "bn" ? "ইনস্টিটিউট সেমিনার" : "Institute seminar"}
                className="aspect-video w-full object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-emerald-deep/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold bg-emerald-deep/70 backdrop-blur">
                  <Play aria-hidden className="h-5 w-5 fill-gold text-gold" />
                </span>
              </div>
            </div>
            <Button asChild className="w-full bg-gold-gradient font-semibold text-gold-foreground hover:opacity-95">
              <a href={siteConfig.socials.youtube} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden className="h-4 w-4" />
                {lang === "bn" ? "YouTube-এ ভিডিও দেখুন" : "Watch on YouTube"}
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
