import { cn } from "@/lib/utils";

/**
 * Eight-pointed star ornament — the institute's signature motif,
 * used inline between titles, in dividers, and as watermark marks.
 */
export function StarMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={cn("h-4 w-4", className)}>
      <path d="M12 0l2.6 6.2L21 3l-3.2 6.4L24 12l-6.2 2.6L21 21l-6.4-3.2L12 24l-2.6-6.2L3 21l3.2-6.4L0 12l6.2-2.6L3 3l6.4 3.2L12 0z" />
    </svg>
  );
}

/** Gold divider with a central star — separates major sections. */
export function GoldRule({ className, tone = "default" }: { className?: string; tone?: "default" | "on-dark" }) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)} aria-hidden>
      <span className={cn("h-px w-16 sm:w-24", tone === "on-dark" ? "bg-gold/50" : "bg-gold/60")} />
      <StarMotif className={cn("h-3.5 w-3.5", tone === "on-dark" ? "text-gold/80" : "text-gold")} />
      <span className={cn("h-px w-16 sm:w-24", tone === "on-dark" ? "bg-gold/50" : "bg-gold/60")} />
    </div>
  );
}

/** Bismillah calligraphic line rendered in the Amiri typeface. */
export function Bismillah({ className }: { className?: string }) {
  return (
    <p
      dir="rtl"
      lang="ar"
      className={cn("font-arabic text-2xl leading-relaxed sm:text-3xl", className)}
      aria-label="বিসমিল্লাহির রাহমানির রাহীম"
    >
      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
    </p>
  );
}

/** Corner ornament for cards on dark backgrounds. */
export function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className={cn("pointer-events-none absolute h-16 w-16 text-gold/40", className)}
    >
      <path
        d="M2 46V18C2 9.16 9.16 2 18 2h28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 46V22c0-7.73 6.27-14 14-14h22"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
