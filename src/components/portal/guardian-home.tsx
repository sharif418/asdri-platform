import { Baby, CalendarDays, GraduationCap, Hash } from "lucide-react";
import type { GuardianChildView } from "@/lib/portals/access";
import {
  applicationStatusLabel,
  applicationStatusChip,
} from "@/lib/admission-labels";
import { STATUS_FLOW, statusLabel } from "@/components/admissions/status-track";
import { formatDate, toBnDigits } from "@/lib/format";
import type { ApplicationStatus } from "@prisma/client";

/**
 * Guardian portal home: exactly the children linked to this account — the
 * list comes from getGuardianChildren, which reads only this guardian's
 * GuardianLinks. Another family's child cannot appear here.
 *
 * Each child renders as a keepsake card: avatar initial, relation badge,
 * the one-glance application rail (same visual language as the applicant's
 * StatusTrack, denser), and the tracking number in mono for dictating over
 * the phone to the office.
 */
export function GuardianHome({ children_ }: { children_: GuardianChildView[] }) {
  if (children_.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gold/40 bg-card px-6 py-14 text-center">
        <Baby aria-hidden className="mx-auto h-8 w-8 text-gold" />
        <h2 className="mt-3 text-lg font-bold">এখনো কোনো সন্তানের তথ্য যুক্ত নেই</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          ভর্তি কর্মকর্তা আপনার সন্তানের আবেদনের সঙ্গে আপনার অ্যাকাউন্ট যুক্ত করলে এখানে
          অগ্রগতি দেখতে পাবেন। এখনো যুক্ত হয়নি মনে হলে অফিসে জানান।
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {children_.map((child) => (
        <ChildCard key={child.linkId} child={child} />
      ))}
    </div>
  );
}

function ChildCard({ child }: { child: GuardianChildView }) {
  const application = child.application;
  const currentIndex = application ? STATUS_FLOW.indexOf(application.status as ApplicationStatus) : -1;
  const offTrack =
    application?.status === "REJECTED" || application?.status === "WAITLISTED";

  return (
    <section className="group rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-gold/40 hover:shadow-md sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/[0.08] text-lg font-bold text-primary"
          >
            {child.studentNameBn.trim().charAt(0) || "স"}
          </span>
          <div>
            <h2 className="text-lg font-bold leading-snug">{child.studentNameBn}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <span className="rounded-full border border-gold/30 bg-gold/[0.06] px-2 py-0.5 text-[11px] font-semibold text-gold-foreground dark:text-gold">
                {child.relation}
              </span>
              {application?.courseCode ? (
                <span className="rounded-full border px-2 py-0.5 font-mono text-[10.5px] font-bold tracking-wide text-muted-foreground" dir="ltr">
                  {application.courseCode}
                </span>
              ) : null}
            </p>
          </div>
        </div>
        {application ? (
          <span
            className={`rounded-full px-3 py-1 text-[12px] font-bold ${applicationStatusChip(application.status as never)}`}
          >
            {applicationStatusLabel(application.status as never)}
          </span>
        ) : null}
      </div>

      {application ? (
        <>
          {/* one-glance progress rail — the applicant's StatusTrack language,
              denser; REJECTED/WAITLISTED fall back to the plain meta grid */}
          {!offTrack && currentIndex >= 0 ? (
            <ol
              className="mt-5 flex items-center gap-1"
              aria-label={`${child.studentNameBn} — আবেদনের অগ্রগতি`}
            >
              {STATUS_FLOW.map((step, i) => {
                const done = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <li key={step} className="flex flex-1 items-center">
                    <span
                      title={statusLabel(step, "bn")}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[9.5px] font-bold transition-colors ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      } ${isCurrent ? "ring-2 ring-gold/50 ring-offset-2" : ""}`}
                    >
                      {toBnDigits(i + 1)}
                    </span>
                    {i < STATUS_FLOW.length - 1 ? (
                      <span
                        aria-hidden
                        className={`mx-1 h-0.5 flex-1 rounded ${i < currentIndex ? "bg-primary" : "bg-border"}`}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : null}

          <dl className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <Hash aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  আবেদন নম্বর
                </dt>
                <dd className="mt-0.5 font-mono text-[13.5px] font-bold tracking-wide" dir="ltr">
                  {application.trackingNo}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <GraduationCap aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  কোর্স
                </dt>
                <dd className="mt-0.5 text-[13.5px] font-semibold leading-snug">
                  {application.courseTitleBn ?? "—"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarDays aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  জমার তারিখ
                </dt>
                <dd className="mt-0.5 text-[13.5px] font-semibold">
                  {formatDate(application.submittedAt, "bn")}
                </dd>
              </div>
            </div>
          </dl>
          <p className="mt-3.5 rounded-lg bg-secondary/50 px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
            অবস্থার পরিবর্তন হলে এখানে দেখা যাবে — প্রবেশপত্র ও ফল প্রকাশের খবর নোটিশ বোর্ডেও দেওয়া হয়।
          </p>
        </>
      ) : (
        <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
          এই সন্তানের ভর্তি আবেদনের তথ্য এখনো যুক্ত হয়নি।
        </p>
      )}
    </section>
  );
}
