import { CircleCheck, Target } from "lucide-react";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { LocalizedText, Language } from "@/types";

/** Numbered objectives checklist used on the course detail page. */
export function ObjectivesChecklist({
  objectives,
  lang,
}: {
  objectives: LocalizedText[];
  lang: Language;
}) {
  return (
    <ol className="space-y-4">
      {objectives.map((objective, index) => (
        <li key={`objective-${index}`} className="flex items-start gap-3.5 rounded-xl border bg-card p-4 shadow-sm">
          <span
            aria-hidden
            className="font-heading flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-deep text-sm font-bold text-gold"
          >
            {lang === "bn" ? toBnDigits(index + 1) : index + 1}
          </span>
          <p className="pt-1 text-[15px] leading-relaxed">{pick(objective, lang)}</p>
        </li>
      ))}
    </ol>
  );
}

/** Outcome cards with gold check icons. */
export function OutcomesList({ outcomes, lang }: { outcomes: LocalizedText[]; lang: Language }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {outcomes.map((outcome, index) => (
        <li
          key={`outcome-${index}`}
          className="flex items-start gap-3 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md hover:shadow-emerald-950/5"
        >
          <CircleCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="text-[15px] leading-relaxed">{pick(outcome, lang)}</p>
        </li>
      ))}
    </ul>
  );
}

/** Inline "program goals" strip with a target icon — used above objectives. */
export function SectionIntroNote({
  title,
  body,
  lang,
}: {
  title: LocalizedText;
  body: LocalizedText;
  lang: Language;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
        <Target aria-hidden className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-heading text-lg font-semibold leading-snug">{pick(title, lang)}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{pick(body, lang)}</p>
      </div>
    </div>
  );
}
