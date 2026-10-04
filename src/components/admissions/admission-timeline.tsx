import { CheckCircle2 } from "lucide-react";
import { admissionSteps } from "@/content/admission";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { Language } from "@/types";

/**
 * The 5-step admission journey — a vertical timeline with numbered
 * gold medallions and a connecting rule; content alternates sides on
 * large screens and stacks cleanly on mobile.
 */
export function AdmissionTimeline({ lang }: { lang: Language }) {
  return (
    <ol className="relative space-y-10 md:space-y-12" aria-label={lang === "bn" ? "ভর্তি প্রক্রিয়ার ধাপসমূহ" : "Admission process steps"}>
      {/* connecting spine */}
      <span
        aria-hidden
        className="absolute left-[27.5px] top-2 bottom-2 w-px bg-gradient-to-b from-gold/10 via-gold/60 to-gold/10 md:left-1/2 md:-translate-x-1/2"
      />

      {admissionSteps.map((step, index) => {
        const isEven = index % 2 === 0;
        return (
          <li key={step.step} className="relative md:grid md:grid-cols-2 md:gap-14">
            {/* gold medallion */}
            <div className="absolute left-0 top-0 z-10 md:left-1/2 md:-translate-x-1/2" aria-hidden>
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 bg-gold-gradient shadow-[0_0_0_6px_var(--background)]">
                <span className="font-heading text-lg font-bold text-gold-foreground">
                  {lang === "bn" ? toBnDigits(step.step) : String(step.step)}
                </span>
              </span>
            </div>

            {/* content card */}
            <div
              className={
                isEven
                  ? "ml-20 md:ml-0 md:col-start-1 md:pr-4 md:text-right"
                  : "ml-20 md:ml-0 md:col-start-2 md:pl-4"
              }
            >
              <article className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md sm:p-6">
                <div className={`flex items-center gap-2.5 ${isEven ? "md:justify-end" : ""}`}>
                  <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                    {lang === "bn" ? `ধাপ ${step.step}` : `Step ${step.step}`}
                  </p>
                </div>
                <h3 className="font-heading mt-2 text-lg font-semibold sm:text-xl">
                  {pick(step.title, lang)}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {pick(step.description, lang)}
                </p>
              </article>
            </div>

            {/* spacer for the opposite column */}
            <div className={isEven ? "hidden md:block md:col-start-2" : "hidden md:block md:col-start-1"} aria-hidden />
          </li>
        );
      })}
    </ol>
  );
}
