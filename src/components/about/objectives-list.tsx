import { CheckCircle2 } from "lucide-react";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { getObjectivesList } from "@/lib/content/about";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { Language } from "@/types";

/**
 * The complete 14-point objectives list, rendered as a two-column
 * numbered checklist with gold markers.
 */
export async function ObjectivesList({ lang }: { lang: Language }) {
  const objectivesList = await getObjectivesList();
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "আমাদের উদ্দেশ্য" : "Our Objectives"}
            title={{ bn: "বিস্তারিত উদ্দেশ্যসমূহ", en: "Detailed Objectives" }}
            description={{
              bn: "প্রতিষ্ঠার লক্ষ্য ও স্বপ্ন বাস্তবায়নে ইনস্টিটিউটের নির্ধারিত চৌদ্দটি মূল উদ্দেশ্য।",
              en: "The fourteen core objectives that guide everything the institute does.",
            }}
            lang={lang}
          />
        </Reveal>

        <Stagger className="mt-12 grid gap-4 md:grid-cols-2">
          {objectivesList.length === 0 ? (
            <div className="md:col-span-2">
              <EmptyState lang={lang} subject={{ bn: "উদ্দেশ্য", en: "objectives" }} />
            </div>
          ) : null}
          {objectivesList.map((objective, index) => (
            <RevealItem key={`objective-${index}`}>
              <article className="flex h-full gap-4 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md hover:shadow-emerald-950/5">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-deep text-sm font-bold text-gold"
                >
                  {lang === "bn" ? toBnDigits(index + 1) : index + 1}
                </span>
                <div className="flex items-start gap-3">
                  <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <p className="text-[15px] leading-relaxed text-foreground/90">{pick(objective, lang)}</p>
                </div>
              </article>
            </RevealItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
