import Image from "next/image";
import { brand, type BrandTone } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { Language } from "@/types";

/**
 * The institute's mark (arch, open book, pen and sun) from the official logo.
 * Size it by height; the width follows the artwork's own proportions.
 */
export function InstituteLogo({
  className,
  tone = "default",
  priority = false,
}: {
  className?: string;
  tone?: BrandTone;
  priority?: boolean;
}) {
  return (
    <Image
      src={brand.mark[tone]}
      alt=""
      aria-hidden
      width={brand.mark.width}
      height={brand.mark.height}
      priority={priority}
      className={cn("h-10", className, "w-auto")}
    />
  );
}

/**
 * The full official logo: mark, Arabic calligraphy and the English wordmark in one piece.
 * Reserve for rendered heights ≥ brand.lockupMinHeightPx (44px) — below that the
 * calligraphy stops being legible and the typeset lockup takes over.
 */
export function LogoLockup({
  className,
  tone = "default",
  priority = false,
}: {
  className?: string;
  tone?: BrandTone;
  priority?: boolean;
}) {
  return (
    <Image
      src={brand.lockup[tone]}
      alt={brand.nameEn}
      width={brand.lockup.width}
      height={brand.lockup.height}
      priority={priority}
      sizes="(max-width: 640px) 180px, 260px"
      className={cn("h-11", className, "w-auto")}
    />
  );
}

/**
 * The typeset lockup: the official mark beside the institute's name in the
 * visitor's language. This is the working lockup for tight bars (header at
 * phone/laptop widths) where the calligraphy of the full lockup would render
 * below its legible size — the mark carries the identity, the name carries
 * the words.
 */
export function LogoTextLockup({
  lang,
  tone = "default",
  className,
  markClassName,
  priority = false,
}: {
  lang: Language;
  tone?: BrandTone;
  className?: string;
  markClassName?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <InstituteLogo tone={tone} priority={priority} className={cn("h-9", markClassName)} />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "font-heading font-bold tracking-tight",
            tone === "on-dark" ? "text-ivory" : "text-foreground",
            "text-[15px] sm:text-base",
          )}
        >
          {lang === "bn" ? "আস-সুন্নাহ" : "As-Sunnah"}
        </span>
        <span
          className={cn(
            "mt-1 truncate text-[9.5px] font-semibold uppercase tracking-[0.14em]",
            tone === "on-dark" ? "text-gold" : "text-primary",
          )}
        >
          {lang === "bn" ? "দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট" : "Dawah & Research Institute"}
        </span>
      </span>
    </span>
  );
}

/**
 * One-colour mark for print, watermarks and ornaments. Purely decorative
 * when used as a watermark — always aria-hidden there.
 */
export function BrandMonoMark({
  tone,
  className,
  priority = false,
}: {
  tone: keyof typeof brand.mono;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={brand.mono[tone] as string}
      alt=""
      aria-hidden
      width={brand.mono.width}
      height={brand.mono.height}
      priority={priority}
      className={cn("h-10", className, "w-auto")}
    />
  );
}

/**
 * The mark as a quiet watermark — the way the best institutions let their
 * identity reappear inside the site instead of only on its chrome.
 * Decorative by contract: aria-hidden, pointer-events-none.
 */
export function BrandWatermark({
  tone = "emerald",
  className,
}: {
  tone?: keyof typeof brand.mono;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute select-none", className)}>
      <BrandMonoMark tone={tone} className="h-full w-auto" />
    </span>
  );
}
