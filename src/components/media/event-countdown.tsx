"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { toBnDigits } from "@/lib/format";
import type { Language } from "@/types";
import { cn } from "@/lib/utils";

interface EventCountdownProps {
  targetIso: string;
  lang: Language;
  /** Remaining seconds computed on the server — avoids hydration mismatch. */
  initialSeconds: number;
  className?: string;
}

interface Unit {
  id: string;
  value: number;
  labelBn: string;
  labelEn: string;
}

function secondsLeft(targetIso: string): number {
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.floor((target - Date.now()) / 1000));
}

/**
 * Live countdown to an event date. Ticks every second via an interval
 * (initial value is server-computed); renders Bengali digits for bn.
 */
export function EventCountdown({ targetIso, lang, initialSeconds, className }: EventCountdownProps) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(secondsLeft(targetIso));
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  const elapsed = remaining <= 0;

  const units: Unit[] = [
    { id: "days", value: Math.floor(remaining / 86400), labelBn: "দিন", labelEn: "Days" },
    { id: "hours", value: Math.floor((remaining % 86400) / 3600), labelBn: "ঘণ্টা", labelEn: "Hours" },
    { id: "minutes", value: Math.floor((remaining % 3600) / 60), labelBn: "মিনিট", labelEn: "Minutes" },
    { id: "seconds", value: remaining % 60, labelBn: "সেকেন্ড", labelEn: "Seconds" },
  ];

  if (elapsed) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-primary dark:text-gold",
          className,
        )}
      >
        <CheckCircle2 aria-hidden className="h-4 w-4" />
        {lang === "bn" ? "কাউন্টডাউন শেষ — অনুষ্ঠান অনুষ্ঠিত/চলমান" : "Countdown over — event started"}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-stretch gap-2 rounded-2xl border border-gold/30 bg-card p-2.5 shadow-sm",
        className,
      )}
      role="timer"
      aria-label={lang === "bn" ? "অনুষ্ঠান শুরু হতে বাকি সময়" : "Time remaining until the event"}
    >
      <span className="flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <CalendarClock aria-hidden className="h-4 w-4 text-gold" />
        {lang === "bn" ? "শুরু হতে বাকি" : "Starts in"}
      </span>
      {units.map((unit) => (
        <div
          key={unit.id}
          className="flex min-w-[64px] flex-col items-center rounded-xl bg-emerald-deep px-3 py-1.5 text-ivory"
        >
          <span className="font-heading text-xl font-bold tabular-nums text-gold sm:text-2xl">
            {lang === "bn" ? toBnDigits(unit.value) : String(unit.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-ivory/70">
            {lang === "bn" ? unit.labelBn : unit.labelEn}
          </span>
        </div>
      ))}
    </div>
  );
}
