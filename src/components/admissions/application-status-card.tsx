import { CheckCircle2, Clock, FileText, GraduationCap } from "lucide-react";
import { toBnDigits } from "@/lib/format";
import type { Lang } from "@/lib/locale";
import type { Application, ApplicationEvent, Intake } from "@prisma/client";

type AppRow = Application & {
  intake: Intake & { course: { titleBn: string; titleEn: string; code: string } };
  events: ApplicationEvent[];
};

const STATUS_FLOW: Application["status"][] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "EXAM_SCHEDULED",
  "EXAM_TAKEN",
  "INTERVIEW",
  "ADMITTED",
];

const STATUS_LABELS: Record<Application["status"], { bn: string; en: string }> = {
  DRAFT: { bn: "খসড়া", en: "Draft" },
  SUBMITTED: { bn: "জমা হয়েছে", en: "Submitted" },
  UNDER_REVIEW: { bn: "যাচাই চলছে", en: "Under review" },
  SHORTLISTED: { bn: "প্রাথমিক বাছাই", en: "Shortlisted" },
  EXAM_SCHEDULED: { bn: "পরীক্ষার তারিখ নির্ধারিত", en: "Exam scheduled" },
  EXAM_TAKEN: { bn: "পরীক্ষা সম্পন্ন", en: "Exam taken" },
  INTERVIEW: { bn: "মৌখিক পরীক্ষা", en: "Viva" },
  ADMITTED: { bn: "ভর্তি নিশ্চিত", en: "Admitted" },
  WAITLISTED: { bn: "অপেক্ষমাণ তালিকা", en: "Waitlisted" },
  REJECTED: { bn: "নির্বাচিত হননি", en: "Not selected" },
};

/** Applicant's view of their application — status track + event history. */
export function ApplicationStatusCard({ application, lang }: { application: AppRow; lang: Lang }) {
  const bn = lang === "bn";
  const currentIndex = STATUS_FLOW.indexOf(application.status);

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
              {bn ? STATUS_LABELS[application.status].bn : STATUS_LABELS[application.status].en}
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

      {/* progress track */}
      {application.status !== "REJECTED" && application.status !== "WAITLISTED" && (
        <ol className="mt-5 flex items-center gap-1" aria-label={bn ? "আবেদনের অগ্রগতি" : "Application progress"}>
          {STATUS_FLOW.map((step, i) => {
            const done = i <= currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <li key={step} className="flex flex-1 items-center">
                <span
                  title={bn ? STATUS_LABELS[step].bn : STATUS_LABELS[step].en}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors ${
                    done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"
                  } ${isCurrent ? "ring-2 ring-gold/50 ring-offset-2" : ""}`}
                >
                  {done ? <CheckCircle2 aria-hidden className="h-3.5 w-3.5" /> : toBnDigits(i + 1)}
                </span>
                {i < STATUS_FLOW.length - 1 && (
                  <span className={`mx-1 h-0.5 flex-1 rounded ${i < currentIndex ? "bg-primary" : "bg-border"}`} aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
      )}

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

      {/* event history */}
      <details className="mt-4 border-t pt-3">
        <summary className="flex cursor-pointer items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground">
          <FileText aria-hidden className="h-3.5 w-3.5" />
          {bn ? "প্রক্রিয়ার ধাপসমূহ" : "Process history"}
        </summary>
        <ul className="mt-3 space-y-2.5 border-l-2 border-gold/40 pl-4">
          {application.events.map((event) => (
            <li key={event.id} className="relative">
              <span aria-hidden className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rotate-45 bg-gold" />
              <p className="text-[12.5px] font-medium">
                {bn ? STATUS_LABELS[event.status]?.bn ?? event.status : STATUS_LABELS[event.status]?.en ?? event.status}
              </p>
              {event.note && <p className="text-[11.5px] text-muted-foreground">{event.note}</p>}
              <p className="text-[10.5px] text-muted-foreground">
                {event.createdAt.toLocaleDateString(bn ? "bn-BD" : "en-GB")}
              </p>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}
