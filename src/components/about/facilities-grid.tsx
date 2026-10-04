import { BedDouble, Library, MoonStar, NotebookPen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { facilities } from "@/content/admission";
import { pick } from "@/types";
import type { Language } from "@/types";

const facilityIcons: Record<string, LucideIcon> = {
  "bed-double": BedDouble,
  library: Library,
  "notebook-pen": NotebookPen,
  "moon-star": MoonStar,
};

/** Campus facilities — icon cards on a parchment band. */
export function FacilitiesGrid({ lang }: { lang: Language }) {
  return (
    <section className="bg-parchment py-16 sm:py-24 dark:bg-secondary/30">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "ক্যাম্পাস সুবিধা" : "Campus Facilities"}
            title={{ bn: "শিক্ষার্থীদের জন্য প্রতিষ্ঠান সুবিধাসমূহ", en: "Institutional Facilities for Students" }}
            description={{
              bn: "আবাসন থেকে আধ্যাত্মিক পরিবেশ — প্রতিটি সুবিধা শিক্ষার্থীর ব্যক্তিগত ও একাডেমিক বিকাশকে কেন্দ্র করে সাজানো।",
              en: "From housing to a spiritual environment — every facility is designed around student growth, personal and academic.",
            }}
            lang={lang}
          />
        </Reveal>

        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((facility) => {
            const Icon = facilityIcons[facility.icon] ?? Library;
            return (
              <RevealItem key={facility.id}>
                <article className="h-full rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold shadow-md">
                    <Icon aria-hidden className="h-6 w-6" />
                  </span>
                  <h3 className="font-heading mt-4 text-base font-semibold leading-snug">
                    {pick(facility.title, lang)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {pick(facility.description, lang)}
                  </p>
                </article>
              </RevealItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
