import { CheckCircle2, Clock, FileText } from "lucide-react";
import { toBnDigits } from "@/lib/format";
import type { Lang } from "@/lib/locale";
import type { ApplicationStatus } from "@prisma/client";

/**
 * Shared admission-status vocabulary + progress track — used by BOTH the
 * signed-in account page (ApplicationStatusCard) and the public
 * /admissions/status lookup, so the two can never drift apart.
 */

export const STATUS_FLOW: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "EXAM_SCHEDULED",
  "EXAM_TAKEN",
  "INTERVIEW",
  "ADMITTED",
];

export const STATUS_LABELS: Record<ApplicationStatus, { bn: string; en: string }> = {
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

/** What the applicant should do next, per status (public lookup guidance). */
export const STATUS_GUIDANCE: Record<ApplicationStatus, { bn: string; en: string }> = {
  DRAFT: { bn: "", en: "" },
  SUBMITTED: {
    bn: "আবেদন গৃহীত হয়েছে। প্রাথমিক যাচাইয়ের জন্য অপেক্ষা করুন — পরবর্তী যেকোনো বিজ্ঞপ্তি নোটিশ বোর্ডে প্রকাশিত হবে।",
    en: "Your application has been received. Please wait for the initial screening — further announcements appear on the notice board.",
  },
  UNDER_REVIEW: {
    bn: "আপনার কাগজপত্র যাচাই করা হচ্ছে। এই পর্যায়ে কিছু করার নেই — ফলাফলের অপেক্ষায় থাকুন।",
    en: "Your documents are being verified. Nothing to do at this stage — please wait for the outcome.",
  },
  SHORTLISTED: {
    bn: "মাশাআল্লাহ, আপনি প্রাথমিকভাবে নির্বাচিত! লিখিত পরীক্ষার প্রস্তুতি নিন — তারিখ ও সময়সূচি নোটিশ বোর্ডে প্রকাশ হবে।",
    en: "You are shortlisted! Prepare for the written test — its date and schedule will be published on the notice board.",
  },
  EXAM_SCHEDULED: {
    bn: "লিখিত পরীক্ষার তারিখ নির্ধারিত হয়েছে — আসন ও সময়সূচির জন্য ভর্তি বিজ্ঞপ্তি দেখুন এবং প্রস্তুতি সম্পন্ন করুন।",
    en: "Your written exam is scheduled — see the admission notices for venue and timings, and complete your preparation.",
  },
  EXAM_TAKEN: {
    bn: "লিখিত পরীক্ষা সম্পন্ন হয়েছে। ফলাফল ও মৌখিক পরীক্ষার (ভাইভা) তারিখের জন্য অপেক্ষা করুন।",
    en: "The written test is done. Wait for the result and the viva schedule.",
  },
  INTERVIEW: {
    bn: "আপনি মৌখিক পরীক্ষার (ভাইভা) জন্য নির্বাচিত — তারিখ শিঘ্রই জানানো হবে, ফোনে যোগাযোগ আসতে পারে।",
    en: "You are selected for the viva — the date will be announced soon, and you may receive a phone call.",
  },
  ADMITTED: {
    bn: "মাশাআল্লাহ, আপনার ভর্তি নিশ্চিত! নির্ধারিত সময়ের মধ্যে ভর্তি ফি পরিশোধ করে অফিসে যোগাযোগ করুন।",
    en: "You are admitted! Pay the admission fee within the given time and contact the office.",
  },
  WAITLISTED: {
    bn: "আপনি অপেক্ষমাণ তালিকায় আছেন — আসন খালি হলে ফোনে জানানো হবে। আগ্রহ থাকলে অফিসে যোগাযোগ করে রাখুন।",
    en: "You are on the waiting list — you will be called if a seat opens. Keep in touch with the office.",
  },
  REJECTED: {
    bn: "এবারের ইনটেকে নির্বাচিত হননি। আগামী ভর্তি বিজ্ঞপ্তিতে আবার আবেদন করতে পারেন — আমরা আপনার সাথে আছি।",
    en: "You were not selected this intake. You are welcome to apply again in the next circular.",
  },
};

export function statusLabel(status: ApplicationStatus, lang: Lang): string {
  return lang === "bn" ? STATUS_LABELS[status].bn : STATUS_LABELS[status].en;
}

interface StatusTrackProps {
  status: ApplicationStatus;
  lang: Lang;
  /** Stage-change history (status + time) — notes stay private to the office
   *  on the PUBLIC lookup (showNotes=false); the account page shows its own. */
  events?: { status: ApplicationStatus; at: Date | string; note?: string | null }[];
  /** Wrap the history in a collapsible <details> (account-page behaviour). */
  collapsibleHistory?: boolean;
  /** Render officer-written event notes (authenticated applicant only). */
  showNotes?: boolean;
}

/** Numbered-dots progress track + (optional) stage history. */
export function StatusTrack({
  status,
  lang,
  events = [],
  collapsibleHistory = false,
  showNotes = false,
}: StatusTrackProps) {
  const bn = lang === "bn";
  const currentIndex = STATUS_FLOW.indexOf(status);

  const track =
    status === "REJECTED" || status === "WAITLISTED" ? null : (
      <ol className="mt-5 flex items-center gap-1" aria-label={bn ? "আবেদনের অগ্রগতি" : "Application progress"}>
        {STATUS_FLOW.map((step, i) => {
          const done = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <li key={step} className="flex flex-1 items-center">
              <span
                title={statusLabel(step, lang)}
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
    );

  if (events.length === 0) return <>{track}</>;

  const history = (
    <ul className="mt-3 space-y-2.5 border-l-2 border-gold/40 pl-4">
      {events.map((event, i) => (
        <li key={`${event.status}-${i}`} className="relative">
          <span aria-hidden className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rotate-45 bg-gold" />
          <p className="text-[12.5px] font-medium">{statusLabel(event.status, lang)}</p>
          {showNotes && event.note ? <p className="text-[11.5px] text-muted-foreground">{event.note}</p> : null}
          <p className="text-[10.5px] text-muted-foreground">
            {new Date(event.at).toLocaleDateString(bn ? "bn-BD" : "en-GB")}
          </p>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {track}
      {collapsibleHistory ? (
        <details className="mt-4 border-t pt-3">
          <summary className="flex cursor-pointer items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground">
            <FileText aria-hidden className="h-3.5 w-3.5" />
            {bn ? "প্রক্রিয়ার ধাপসমূহ" : "Process history"}
          </summary>
          {history}
        </details>
      ) : (
        <div className="mt-4 border-t pt-3">
          <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground">
            <Clock aria-hidden className="h-3.5 w-3.5" />
            {bn ? "প্রক্রিয়ার ধাপসমূহ" : "Process history"}
          </p>
          {history}
        </div>
      )}
    </>
  );
}
