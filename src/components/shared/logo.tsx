import Image from "next/image";
import { brand, type BrandTone } from "@/lib/brand";
import { cn } from "@/lib/utils";

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
 * This replaces the former emblem + three text lines everywhere the brand appears.
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

/** Smaller lockup for tight bars (kept for call sites that used the old compact form). */
export function LogoCompact({ className, tone = "default" }: { className?: string; tone?: BrandTone }) {
  return <LogoLockup tone={tone} className={cn("h-9", className)} />;
}
