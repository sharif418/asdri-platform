import Link from "next/link";
import { ChevronRight, Pin } from "lucide-react";
import { langPath } from "@/lib/locale";
import type { Language } from "@/types";

interface UrgentStripProps {
  lang: Language;
  notice: { slug: string; title: { bn: string; en: string } };
}

/**
 * Slim urgent-announcement banner rendered above the hero — shown ONLY while
 * at least one pinned notice exists (links to the top pinned notice).
 * Rendered conditionally by the homepage; with 0 pins nothing appears.
 */
export function UrgentStrip({ lang, notice }: UrgentStripProps) {
  const bn = lang === "bn";

  return (
    <Link
      href={langPath(lang, `/notices?notice=${notice.slug}`)}
      className="group block border-b border-gold/40 bg-gold/10 transition-colors hover:bg-gold/20"
    >
      <div className="container-site flex min-h-11 items-center justify-center gap-2.5 py-2 sm:gap-3">
        <span
          aria-hidden
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold"
        >
          <Pin className="h-3.5 w-3.5" />
        </span>
        <span className="shrink-0 text-[11.5px] font-bold uppercase tracking-wider text-gold">
          {bn ? "জরুরি ঘোষণা" : "Urgent Announcement"}
        </span>
        <span aria-hidden className="hidden h-4 w-px bg-gold/40 sm:block" />
        <span className="truncate text-[13px] font-semibold text-foreground">
          {bn ? notice.title.bn : notice.title.en}
        </span>
        <ChevronRight
          aria-hidden
          className="h-4 w-4 shrink-0 text-gold transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}
