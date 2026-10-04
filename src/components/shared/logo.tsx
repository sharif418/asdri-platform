import { cn } from "@/lib/utils";

/**
 * Institute emblem — an open book beneath a crescent and eight-pointed star,
 * drawn as scalable vector art in the brand palette.
 */
export function InstituteLogo({ className, tone = "default" }: { className?: string; tone?: "default" | "on-dark" }) {
  const bookStroke = tone === "on-dark" ? "#e9d9a8" : "#0e5940";
  const crescentFill = tone === "on-dark" ? "#e9d9a8" : "#c9a24b";
  const starFill = tone === "on-dark" ? "#ffffff" : "#0e5940";

  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className={cn("h-10 w-10", className)}>
      {/* Ring */}
      <circle cx="32" cy="32" r="30" stroke={crescentFill} strokeWidth="1.6" opacity="0.9" />
      <circle cx="32" cy="32" r="27" stroke={crescentFill} strokeWidth="0.7" opacity="0.5" />
      {/* Crescent */}
      <path
        d="M39.5 10.5a13 13 0 1 0 6.4 17.2 10.5 10.5 0 1 1-6.4-17.2z"
        fill={crescentFill}
      />
      {/* Eight-pointed star */}
      <path
        d="M44.6 9.4l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z"
        fill={starFill}
      />
      {/* Open book */}
      <path
        d="M14 40.5c5.4-3.2 10.9-3.2 16.3 0v10c-5.4-3.2-10.9-3.2-16.3 0z"
        fill={bookStroke}
      />
      <path
        d="M33.7 40.5c5.4-3.2 10.9-3.2 16.3 0v10c-5.4-3.2-10.9-3.2-16.3 0z"
        fill={bookStroke}
        opacity="0.82"
      />
      <path d="M32 39.6v11.4" stroke={crescentFill} strokeWidth="1.4" strokeLinecap="round" />
      {/* Book text lines */}
      <path
        d="M18 43.2c3.2-1.5 6.4-1.5 9.6 0M18 46.4c3.2-1.5 6.4-1.5 9.6 0M36.4 43.2c3.2-1.5 6.4-1.5 9.6 0M36.4 46.4c3.2-1.5 6.4-1.5 9.6 0"
        stroke="#ffffff"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

/** Full lockup: emblem + bilingual institute name + parent line. */
export function LogoLockup({
  nameBn,
  nameEn,
  parentBn,
  tone = "default",
  className,
}: {
  nameBn: string;
  nameEn: string;
  parentBn: string;
  tone?: "default" | "on-dark";
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <InstituteLogo tone={tone} className="h-11 w-11 shrink-0" />
      <span className="hidden min-w-0 flex-col sm:flex">
        <span
          className={cn(
            "font-heading truncate text-[15px] font-semibold leading-snug sm:text-[16px]",
            tone === "on-dark" ? "text-ivory" : "text-foreground",
          )}
        >
          {nameBn}
        </span>
        <span
          className={cn(
            "truncate text-[10px] font-medium tracking-wide",
            tone === "on-dark" ? "text-gold/90" : "text-gold",
          )}
        >
          {parentBn}
        </span>
        <span
          className={cn(
            "truncate text-[9px] uppercase tracking-[0.16em]",
            tone === "on-dark" ? "text-ivory/60" : "text-muted-foreground",
          )}
        >
          {nameEn}
        </span>
      </span>
    </span>
  );
}

/** Compact variant showing just the emblem + short name (mobile). */
export function LogoCompact({ shortBn, shortEn, tone = "default" }: { shortBn: string; shortEn: string; tone?: "default" | "on-dark" }) {
  return (
    <span className="flex items-center gap-2">
      <InstituteLogo tone={tone} className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-tight">
        <span className={cn("font-heading text-sm font-semibold", tone === "on-dark" ? "text-ivory" : "text-foreground")}>
          {shortBn}
        </span>
        <span className={cn("text-[9px] uppercase tracking-[0.18em]", tone === "on-dark" ? "text-gold/80" : "text-gold")}>
          {shortEn}
        </span>
      </span>
    </span>
  );
}
