import { StarMotif } from "@/components/shared/ornaments";
import { pysSpecializations } from "@/content/courses/pys";
import { pick } from "@/types";
import type { Language } from "@/types";

/** PYS specialization departments — five tracks with Arabic names. */
export function PysSpecializations({ lang }: { lang: Language }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {pysSpecializations.map((spec, index) => (
        <article
          key={spec.en}
          className="group relative flex h-full flex-col items-center overflow-hidden rounded-xl border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/10"
        >
          <span
            aria-hidden
            className="font-heading flex h-10 w-10 items-center justify-center rounded-full bg-emerald-deep text-sm font-bold text-gold"
          >
            {lang === "bn" ? ["১", "২", "৩", "৪", "৫"][index] : index + 1}
          </span>
          <p dir="rtl" lang="ar" className="font-arabic mt-3 text-lg leading-relaxed text-gold">
            {spec.ar}
          </p>
          <h3 className="font-heading mt-2 text-base font-semibold leading-snug">{pick(spec, lang)}</h3>
          <div aria-hidden className="mt-3 flex items-center justify-center">
            <StarMotif className="h-2.5 w-2.5 text-gold/50 transition-transform group-hover:rotate-45" />
          </div>
        </article>
      ))}
    </div>
  );
}
