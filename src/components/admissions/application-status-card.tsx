import { GraduationCap } from "lucide-react";
import { CalendarDays, Clock, MapPin } from "lucide-react";
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

      {/* exam schedule when shortlisted — date, time and venue the office
          persisted on the intake (round 5); time/venue may still be blank
          while the office has not set them */}
      {application.intake.examDate &&
        ["SHORTLISTED", "EXAM_SCHEDULED", "EXAM_TAKEN", "INTERVIEW"].includes(application.status) && (
          <div className="mt-4 overflow-hidden rounded-xl border border-gold/40 bg-gold/[0.06]">
            <p className="flex items-center gap-2 border-b border-gold/30 bg-gold/10 px-4 py-2 text-[12px] font-bold tracking-wide text-gold-foreground dark:text-gold">
              <CalendarDays aria-hidden className="h-4 w-4" />
              {bn ? "লিখিত পরীক্ষার সময়সূচি" : "Written exam schedule"}
            </p>
            <dl className="grid gap-x-6 gap-y-2.5 px-4 py-3 text-[13px] sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <CalendarDays aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {bn ? "তারিখ" : "Date"}
                  </dt>
                  <dd className="font-semibold">
                    {new Date(application.intake.examDate).toLocaleDateString(bn ? "bn-BD" : "en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              </div>
              {application.intake.examTimeBn ? (
                <div className="flex items-start gap-2.5">
                  <Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {bn ? "সময়" : "Time"}
                    </dt>
                    <dd className="font-semibold">{application.intake.examTimeBn}</dd>
                  </div>
                </div>
              ) : null}
              {application.intake.examVenueBn ? (
                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {bn ? "স্থান" : "Venue"}
                    </dt>
                    <dd className="font-semibold">{application.intake.examVenueBn}</dd>
                  </div>
                </div>
              ) : null}
            </dl>
            {!application.intake.examTimeBn && !application.intake.examVenueBn ? (
              <p className="border-t border-gold/25 px-4 py-2 text-[11.5px] text-muted-foreground">
                {bn
                  ? "সময় ও স্থান নির্ধারণ হলে এখানে ও প্রবেশপত্রে দেখা যাবে — নোটিশ বোর্ডেও চোখ রাখুন।"
                  : "Time and venue will appear here once the office announces them."}
              </p>
            ) : null}
          </div>
        )}
    </article>
  );
}
