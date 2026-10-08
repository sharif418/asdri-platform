import Link from "next/link";
import type { FunnelStep } from "@/lib/insights";
import { toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { statusLabel } from "@/components/admissions/status-track";

/**
 * AdmissionsFunnelRail — point-in-time journey counts for one intake
 * (round-9 restore of the round-8 module). The steps follow the applicant's
 * StatusTrack order; ADMITTED renders in gold; zero steps dim; the seats fill
 * line shows how full the batch is. Server-rendered, deep-links to the
 * applications page filtered by intake.
 */

export function AdmissionsFunnelRail({
  intakeTitleBn,
  seatsTotal,
  admitted,
  steps,
  intakeId,
}: {
  intakeTitleBn: string;
  seatsTotal: number | null;
  admitted: number;
  steps: FunnelStep[];
  intakeId: string;
}) {
  const seatFill = seatsTotal != null && seatsTotal > 0 ? Math.min(100, Math.round((admitted / seatsTotal) * 100)) : null;
  return (
    <div className="min-w-0 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/admissions/applications?intakeId=${intakeId}`}
          className="text-[13px] font-bold leading-snug hover:text-primary hover:underline"
        >
          {intakeTitleBn}
        </Link>
        {seatsTotal != null && seatsTotal > 0 ? (
          <span className="shrink-0 rounded-full border border-gold/30 bg-gold/[0.06] px-2 py-0.5 text-[10.5px] font-bold text-gold-foreground dark:text-gold">
            {toBnDigits(admitted)}/{toBnDigits(seatsTotal)} আসন
          </span>
        ) : null}
      </div>

      {/* seats fill line */}
      {seatFill !== null ? (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${seatFill}%` }} />
        </div>
      ) : null}

      {/* the journey rail */}
      <ol className="mt-3.5 flex items-end gap-1" aria-label={`${intakeTitleBn} — আবেদনের অগ্রগতি`}>
        {steps.map((step, i) => {
          const isAdmitted = step.status === "ADMITTED";
          return (
            <li key={step.status} className="flex min-w-0 flex-1 flex-col items-center">
              <span
                className={cn(
                  "text-[10.5px] font-bold leading-none",
                  step.count === 0 ? "text-muted-foreground/60" : isAdmitted ? "text-gold-foreground dark:text-gold" : "text-foreground",
                )}
              >
                {toBnDigits(step.count)}
              </span>
              <span
                title={statusLabel(step.status, "bn")}
                className={cn(
                  "mt-1 flex h-6 w-full max-w-7 items-center justify-center rounded-full border-2 text-[9px] font-bold",
                  step.count === 0
                    ? "border-border bg-background text-muted-foreground/50"
                    : isAdmitted
                      ? "border-gold bg-gold/20 text-gold-foreground dark:text-gold"
                      : "border-primary bg-primary text-primary-foreground",
                )}
              >
                {toBnDigits(i + 1)}
              </span>
              <span className="mt-1.5 w-full truncate text-center text-[8.5px] font-semibold leading-tight text-muted-foreground">
                {statusLabel(step.status, "bn")}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
