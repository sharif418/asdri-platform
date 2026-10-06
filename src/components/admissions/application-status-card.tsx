import { GraduationCap, Clock } from "lucide-react";
import { StatusTrack, statusLabel } from "@/components/admissions/status-track";
import type { Lang } from "@/lib/locale";
import type { Application, ApplicationEvent, Intake } from "@prisma/client";

type AppRow = Application & {
  intake: Intake & { course: { titleBn: string; titleEn: string; code: string } };
  events: ApplicationEvent[];
};

/** Applicant's view of their application — status track + event history. */
export function ApplicationStatusCard({ application, lang }: { application: AppRow; lang: Lang }) {
  const bn = lang === "bn";

  return (
    <article className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-primary">
              {application.trackingNo}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                application.status === "ADMITTED"
                  ? "bg-primary text-primary-foreground"
                  : application.status === "REJECTED"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-gold/15 text-gold"
              }`}
            >
              {statusLabel(application.status, lang)}
            </span>
          </div>
          <h3 className="font-heading mt-2 text-[16px] font-bold leading-snug">
            {bn ? application.intake.course.titleBn : application.intake.course.titleEn}
          </h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {bn ? "জমা:" : "Submitted:"}{" "}
            {application.submittedAt.toLocaleDateString(bn ? "bn-BD" : "en-GB")}
          </p>
        </div>
        <GraduationCap aria-hidden className="h-8 w-8 text-primary/30" />
      </div>

      <StatusTrack
        status={application.status}
        lang={lang}
        events={application.events.map((e) => ({ status: e.status, at: e.createdAt, note: e.note }))}
        collapsibleHistory
        showNotes
      />

      {/* exam schedule when shortlisted */}
      {application.intake.examDate &&
        ["SHORTLISTED", "EXAM_SCHEDULED", "EXAM_TAKEN", "INTERVIEW"].includes(application.status) && (
          <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-gold/10 px-3.5 py-2.5 text-[12.5px] font-medium">
            <Clock aria-hidden className="h-4 w-4 text-gold" />
            {bn ? "লিখিত পরীক্ষা:" : "Written exam:"}{" "}
            {new Date(application.intake.examDate).toLocaleDateString(bn ? "bn-BD" : "en-GB", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        )}
    </article>
  );
}
