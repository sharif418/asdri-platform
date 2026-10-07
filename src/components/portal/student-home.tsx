import Link from "next/link";
import { BookOpenCheck, FileText, GraduationCap } from "lucide-react";
import type { StudentSelfView } from "@/lib/portals/access";
import { applicationStatusLabel, applicationStatusChip } from "@/lib/admission-labels";
import { formatDate } from "@/lib/format";

/** Student portal home: my applications, my admitted course, student notices. */
export function StudentHome({ self }: { self: StudentSelfView }) {
  if (self.applications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gold/40 bg-card px-6 py-14 text-center">
        <GraduationCap aria-hidden className="mx-auto h-8 w-8 text-gold" />
        <h2 className="mt-3 text-lg font-bold">এখনো কোনো আবেদন নেই</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          ভর্তি আবেদন করলে এখানে আপনার আবেদনের অবস্থা, কোর্স ও কারিকুলাম দেখতে পাবেন।
          প্রশ্ন থাকলে অফিসের সঙ্গে যোগাযোগ করুন।
        </p>
        <Link
          href="/admissions"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          ভর্তি তথ্য দেখুন
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {self.applications.map((application) => (
        <section key={application.trackingNo} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                আবেদন নম্বর
              </p>
              <p className="mt-0.5 text-lg font-bold" dir="ltr">
                {application.trackingNo}
              </p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                জমা: {formatDate(application.submittedAt, "bn")}
                {application.courseTitleBn ? ` · ${application.courseTitleBn}` : ""}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${applicationStatusChip(application.status as never)}`}>
              {applicationStatusLabel(application.status as never)}
            </span>
          </div>

          {application.courseSlug ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/academics/courses/${application.courseSlug}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/40 bg-gold-soft/40 px-4 text-[13px] font-semibold text-primary transition-colors hover:bg-gold-soft/70"
              >
                <BookOpenCheck aria-hidden className="h-4 w-4" />
                কোর্স ও কারিকুলাম দেখুন
                <span className="text-[11px] font-medium text-muted-foreground">
                  ({application.semesterCount} সেমিস্টার)
                </span>
              </Link>
              <Link
                href="/notices"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 text-[13px] font-semibold transition-colors hover:border-gold/50"
              >
                <FileText aria-hidden className="h-4 w-4 text-primary" />
                নোটিশ বোর্ড
              </Link>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
