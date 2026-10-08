import Link from "next/link";
import { ArrowRight, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bismillah, CornerOrnament, StarMotif } from "@/components/shared/ornaments";
import { HeroVideoDialog, type HeroVideo } from "@/components/home/hero-video-dialog";
import { getSiteConfig } from "@/lib/content/site";
import { dictionaries } from "@/lib/i18n";
import { langPath } from "@/lib/locale";
import type { Language } from "@/types";

interface HeroProps {
  lang: Language;
  /** Office-chosen hero image (from /admin/content/home); null = default campus photo. */
  heroImageUrl?: string | null;
  /** Featured institute video to embed inside the dialog (null → static fallback). */
  video?: HeroVideo | null;
}

/**
 * Responsive hero backdrop descriptor. Office-chosen media is served through
 * /api/media which resolves `?width=` to the sharp-generated webp variants
 * (md ≈ 800w ~110 KB, lg ≈ 1200w ~190 KB) — a 390 px phone downloads the md
 * variant instead of the full original. srcset/sizes let the browser pick.
 */
function heroSrcSet(heroImageUrl: string): { src: string; srcSet: string } | null {
  if (!heroImageUrl.startsWith("/api/media/")) return null;
  return {
    src: `${heroImageUrl}?width=1200`,
    srcSet: `${heroImageUrl}?width=800 800w, ${heroImageUrl}?width=1200 1200w`,
  };
}

/** Full-bleed hero — campus backdrop, bismillah, headline, dual CTAs, video dialog.
 *
 * Server component: the whole static hero ships as HTML (LCP paints with the
 * document); the video trigger + dialog are the only client island.
 */
export async function Hero({ lang, heroImageUrl, video }: HeroProps) {
  const t = (key: keyof (typeof dictionaries)["bn"]) => dictionaries[lang][key];
  const siteConfig = await getSiteConfig();

  const copy = {
    overline: lang === "bn" ? "দাওয়াহ • শিক্ষা • গবেষণা" : "DAWAH • EDUCATION • RESEARCH",
    subHeading: lang === "bn" ? siteConfig.parentBn : siteConfig.parentEn,
    tagline: lang === "bn" ? siteConfig.taglineBn : siteConfig.taglineEn,
  };

  const responsive = heroImageUrl ? heroSrcSet(heroImageUrl) : null;

  return (
    <section className="texture-grain relative isolate overflow-hidden bg-emerald-deep text-ivory">
      {/* Backdrop — an <img> (not a CSS background) so the browser can pick a
          sized webp variant per viewport/DPR and treat it as the LCP priority. */}
      {responsive ? (
        <img
          aria-hidden
          src={responsive.src}
          srcSet={responsive.srcSet}
          sizes="100vw"
          fetchPriority="high"
          decoding="async"
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : (
        <img
          aria-hidden
          src="/images/hero-campus.png"
          fetchPriority="high"
          decoding="async"
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-deep/95 via-emerald-deep/80 to-emerald-deep/95"
      />
      <div aria-hidden className="pattern-lattice-light absolute inset-0 -z-10 opacity-50" />
      {/* Radial glow — a soft gold lift behind the headline column (the
          illuminated-center convention; pure CSS, no payload) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_42%,rgba(201,162,39,0.16)_0%,rgba(201,162,39,0)_70%)]"
      />

      {/* Corner ornaments — the illuminated-manuscript frame, four corners */}
      <CornerOrnament className="left-4 top-4 rotate-0 sm:left-6 sm:top-6" />
      <CornerOrnament className="right-4 top-4 rotate-90 sm:right-6 sm:top-6" />
      <CornerOrnament className="bottom-4 left-4 -rotate-90 sm:bottom-6 sm:left-6" />
      <CornerOrnament className="bottom-4 right-4 rotate-180 sm:bottom-6 sm:right-6" />

      <div className="container-site relative flex flex-col items-center py-20 text-center sm:py-28 lg:py-32">
        {/* Entrance animations are CSS keyframes (.hero-rise/.hero-fade in
            globals.css) — the headline paints with the first server render,
            not after client-JS hydration, so mobile LCP doesn't wait on the
            bundle. Identical timing to the previous framer-motion config. */}
        <div className="hero-rise flex flex-col items-center">
          <Bismillah className="text-gold/90" />
          <p className="mt-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/90 sm:text-xs">
            <span aria-hidden className="h-px w-10 bg-gold/60" />
            {copy.overline}
            <span aria-hidden className="h-px w-10 bg-gold/60" />
          </p>
        </div>

        <h1
          className="hero-rise font-heading mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.15] sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "0.12s" }}
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
        </h1>

        <p
          className="hero-rise mt-4 text-base font-medium leading-relaxed tracking-wide text-gold sm:text-lg"
          style={{ animationDelay: "0.22s" }}
        >
          {copy.subHeading}
        </p>

        <p
          className="hero-rise mt-5 max-w-2xl text-balance text-[15px] leading-[1.75] text-ivory/80 sm:text-lg"
          style={{ animationDelay: "0.32s" }}
        >
          {copy.tagline}
        </p>

        {/* Star divider — the folio's ornament break between word and deed */}
        <div className="hero-rise mt-7 flex items-center gap-3" aria-hidden style={{ animationDelay: "0.38s" }}>
          <span className="h-px w-14 bg-gradient-to-r from-transparent to-gold/70" />
          <StarMotif className="h-3.5 w-3.5 text-gold/80" />
          <span className="h-px w-14 bg-gradient-to-l from-transparent to-gold/70" />
        </div>

        <div
          className="hero-rise mt-9 flex flex-col items-center gap-3 sm:flex-row"
          style={{ animationDelay: "0.42s" }}
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
        </div>

        <HeroVideoDialog lang={lang} video={video ?? null} youtubeUrl={siteConfig.socials.youtube} />
      </div>

      {/* Bottom fade into page */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gold-gradient" />
    </section>
  );
}
