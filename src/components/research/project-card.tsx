import { CalendarClock, Hourglass, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { Language, ResearchProject } from "@/types";

/**
 * One research project card — status badge, team, description,
 * and a gold-gradient progress bar for ongoing work.
 */
export function ProjectCard({ project, lang }: { project: ResearchProject; lang: Language }) {
  const ongoing = project.status === "ongoing";

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md">
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-1 ${ongoing ? "bg-gold-gradient" : "bg-gradient-to-r from-border via-muted to-border"}`}
      />

      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider ${
            ongoing ? "bg-emerald-deep text-gold" : "border border-border bg-muted text-muted-foreground"
          }`}
        >
          {ongoing ? (
            <Hourglass aria-hidden className="h-3 w-3" />
          ) : (
            <CalendarClock aria-hidden className="h-3 w-3" />
          )}
          {ongoing ? (lang === "bn" ? "চলমান" : "Ongoing") : lang === "bn" ? "আসন্ন" : "Upcoming"}
        </span>
        <span className="font-heading text-2xl font-bold text-gold">
          {lang === "bn" ? `${toBnDigits(project.progress)}%` : `${project.progress}%`}
        </span>
      </div>

      <h3 className="font-heading mt-4 text-base font-semibold leading-snug sm:text-lg">
        {pick(project.title, lang)}
      </h3>
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
        {pick(project.description, lang)}
      </p>

      <div className="mt-5">
        <Progress
          value={project.progress}
          aria-label={`${pick(project.title, lang)} — ${project.progress}%`}
          className="h-2.5 bg-muted [&>div]:bg-gold-gradient"
        />
        <p className="mt-2 text-[11px] font-medium text-muted-foreground">
          {lang === "bn"
            ? `অগ্রগতি: ${toBnDigits(project.progress)}%`
            : `Progress: ${project.progress}%`}
        </p>
      </div>

      {project.team ? (
        <p className="mt-4 flex items-center gap-2 border-t pt-4 text-[12.5px] font-medium text-primary">
          <Users aria-hidden className="h-3.5 w-3.5 text-gold" />
          {pick(project.team, lang)}
        </p>
      ) : (
        <p className="mt-4 flex items-center gap-2 border-t pt-4 text-[12.5px] text-muted-foreground">
          <Users aria-hidden className="h-3.5 w-3.5 text-muted-foreground/60" />
          {lang === "bn" ? "টিম গঠনাধীন — ফেলোশিপের মাধ্যমে গবেষক নিয়োগ হবে" : "Team forming — researchers to be inducted via fellowship"}
        </p>
      )}
    </article>
  );
}
