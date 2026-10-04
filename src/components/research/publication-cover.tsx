import { pick } from "@/types";
import type { Language, PublicationItem } from "@/types";

const typeLabels: Record<PublicationItem["type"], { bn: string; en: string }> = {
  journal: { bn: "জার্নাল", en: "Journal" },
  book: { bn: "গ্রন্থ", en: "Book" },
  paper: { bn: "রিসার্চ পেপার", en: "Research Paper" },
};

/**
 * A pure-CSS publication cover — gradient ground, Amiri calligraphic
 * echo, title, author and year. No images required.
 */
export function PublicationCover({ item, lang }: { item: PublicationItem; lang: Language }) {
  return (
    <div
      className={`relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-xl bg-gradient-to-br ${item.accentClass} p-5 text-ivory shadow-md`}
    >
      {/* lattice texture */}
      <div aria-hidden className="pattern-lattice-light absolute inset-0" />
      {/* spine highlight */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[7px] bg-black/25 shadow-[inset_-2px_0_6px_rgba(0,0,0,0.35)]"
      />
      {/* corner star */}
      <span aria-hidden className="absolute right-3 top-3 text-gold/50">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12 0l2.6 6.2L21 3l-3.2 6.4L24 12l-6.2 2.6L21 21l-6.4-3.2L12 24l-2.6-6.2L3 21l3.2-6.4L0 12l6.2-2.6L3 3l6.4 3.2L12 0z" />
        </svg>
      </span>

      <div className="relative flex h-full flex-col">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-gold">
          {typeLabels[item.type][lang]}
        </p>

        <p dir="rtl" lang="ar" className="font-arabic mt-3 text-right text-xl leading-snug text-gold/90">
          السُّنَّة
        </p>

        <div className="mt-auto">
          <span aria-hidden className="mb-3 block h-px w-10 bg-gold/70" />
          <h4 className="font-heading text-[15px] font-semibold leading-snug text-ivory">
            {pick(item.title, lang)}
          </h4>
          <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-ivory/75">{item.author}</p>
          <p className="mt-2 text-[10.5px] font-semibold tracking-widest text-gold/90">
            {lang === "bn" ? `প্রকাশ: ${item.year}` : `© ${item.year}`}
          </p>
        </div>
      </div>
    </div>
  );
}
