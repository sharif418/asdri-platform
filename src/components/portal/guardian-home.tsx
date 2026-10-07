import { Baby } from "lucide-react";
import type { GuardianChildView } from "@/lib/portals/access";
import { applicationStatusLabel, applicationStatusChip } from "@/lib/admission-labels";
import { formatDate } from "@/lib/format";

/**
 * Guardian portal home: exactly the children linked to this account — the
 * list comes from getGuardianChildren, which reads only this guardian's
 * GuardianLinks. Another family's child cannot appear here.
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
        <section key={child.linkId} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{child.studentNameBn}</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">সম্পর্ক: {child.relation}</p>
            </div>
            {child.application ? (
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-bold ${applicationStatusChip(child.application.status as never)}`}
              >
                {applicationStatusLabel(child.application.status as never)}
              </span>
            ) : null}
          </div>

          {child.application ? (
            <dl className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">আবেদন নম্বর</dt>
                <dd className="mt-0.5 text-[14px] font-semibold" dir="ltr">
                  {child.application.trackingNo}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">কোর্স</dt>
                <dd className="mt-0.5 text-[14px] font-semibold">
                  {child.application.courseTitleBn ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">জমার তারিখ</dt>
                <dd className="mt-0.5 text-[14px] font-semibold">{formatDate(child.application.submittedAt, "bn")}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
              এই সন্তানের ভর্তি আবেদনের তথ্য এখনো যুক্ত হয়নি।
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
