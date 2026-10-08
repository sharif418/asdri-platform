"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BENGALI_MONTHS_BN,
  BENGALI_WEEKDAYS_SHORT,
  bengaliMonthLength,
  bengaliToWire,
  dateToWire,
  gregorianToBengali,
  todayWire,
  wireToBengali,
  type BengaliDate,
} from "@/lib/bengali-date";
import { toBnDigits } from "@/lib/format";

/**
 * BengaliDatePicker — the Bangla-calendar date entry for the admin dialogs
 * (round-9 restore of the round-6 component). The wire contract is the plain
 * "YYYY-MM-DD" Gregorian string the forms already speak; the officer reads
 * বৈশাখ–চৈত্র, Bangla digits, আজ (today) and পরিষ্কার (clear), and moves
 * through the grid with arrow keys.
 */

interface BengaliDatePickerProps {
  id?: string;
  value: string; // "" | "YYYY-MM-DD"
  onChange: (wire: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
  placeholder?: string;
}

const DAY_MS = 86_400_000;

export function BengaliDatePicker({
  id,
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
  placeholder = "তারিখ বাছুন",
}: BengaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<BengaliDate>(() => {
    const parsed = wireToBengali(value);
    return parsed ?? gregorianToBengali(new Date());
  });
  const [focusWire, setFocusWire] = useState<string>(() => value || todayWire());
  const gridRef = useRef<HTMLDivElement>(null);

  // the view resets whenever the popover opens (event handler, not an effect —
  // no cascading renders); the grid then focuses the current day
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    const parsed = wireToBengali(value);
    setViewMonth(parsed ?? gregorianToBengali(new Date()));
    setFocusWire(value || todayWire());
    setTimeout(() => gridRef.current?.querySelector<HTMLElement>("[data-focused='true']")?.focus(), 30);
  }

  const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const todayBn = useMemo(() => todayWire(), []);

  const monthTitle = `${BENGALI_MONTHS_BN[viewMonth.month - 1]} ${toBnDigits(viewMonth.year)}`;

  const stepMonth = useCallback(
    (delta: number) => {
      setViewMonth((current) => {
        let month = current.month + delta;
        let year = current.year;
        if (month < 1) {
          month = 12;
          year -= 1;
        } else if (month > 12) {
          month = 1;
          year += 1;
        }
        return { year, month, day: 1 };
      });
    },
    [],
  );

  function pickDay(wire: string) {
    onChange(wire);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const focusDate = new Date(`${focusWire}T00:00:00Z`);
    if (Number.isNaN(focusDate.getTime())) return;
    let next: Date | null = null;
    switch (event.key) {
      case "ArrowLeft":
        next = new Date(focusDate.getTime() - DAY_MS);
        break;
      case "ArrowRight":
        next = new Date(focusDate.getTime() + DAY_MS);
        break;
      case "ArrowUp":
        next = new Date(focusDate.getTime() - 7 * DAY_MS);
        break;
      case "ArrowDown":
        next = new Date(focusDate.getTime() + 7 * DAY_MS);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        pickDay(focusWire);
        return;
      default:
        return;
    }
    event.preventDefault();
    const wire = dateToWire(next);
    setFocusWire(wire);
    const bengali = gregorianToBengali(next);
    setViewMonth({ year: bengali.year, month: bengali.month, day: 1 });
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>(`[data-day="${wire}"]`)?.focus();
    });
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "flex h-9.5 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-right text-sm text-foreground shadow-sm outline-none transition-colors",
            "hover:border-gold/50 focus:border-gold/60 focus:ring-2 focus:ring-gold/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span className={value ? "" : "text-muted-foreground/70"}>{value ? <WireDisplay wire={value} /> : placeholder}</span>
          <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-gold" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 rounded-xl border bg-card p-3 shadow-xl">
        {/* ——— header: month + year, prev/next ——— */}
        <div className="flex items-center justify-between gap-1 px-1 pb-2">
          <button
            type="button"
            onClick={() => stepMonth(-1)}
            aria-label="আগের মাস"
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </button>
          <p className="text-sm font-bold" aria-live="polite">
            {monthTitle}
          </p>
          <button
            type="button"
            onClick={() => stepMonth(1)}
            aria-label="পরের মাস"
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
          >
            <ChevronRight aria-hidden className="h-4 w-4" />
          </button>
        </div>

        {/* ——— weekday header (Sun-first) ——— */}
        <div className="grid grid-cols-7 border-b pb-1.5 pt-1" aria-hidden>
          {BENGALI_WEEKDAYS_SHORT.map((day) => (
            <span key={day} className="text-center text-[11px] font-semibold text-muted-foreground">
              {day}
            </span>
          ))}
        </div>

        {/* ——— day grid ——— */}
        <div
          ref={gridRef}
          role="grid"
          aria-label={monthTitle}
          className="grid grid-cols-7 gap-0.5 pt-1.5"
          onKeyDown={onKeyDown}
        >
          {days.map((day) => {
            const isSelected = day.wire === value;
            const isToday = day.wire === todayBn;
            const isFocused = day.wire === focusWire;
            const outside = day.month !== viewMonth.month;
            return (
              <button
                key={day.wire}
                type="button"
                role="gridcell"
                data-day={day.wire}
                data-focused={isFocused ? "true" : "false"}
                aria-selected={isSelected}
                aria-current={isToday ? "date" : undefined}
                tabIndex={isFocused ? 0 : -1}
                title={day.wire}
                onClick={() => pickDay(day.wire)}
                onFocus={() => setFocusWire(day.wire)}
                className={cn(
                  "flex h-9 items-center justify-center rounded-lg text-[13px] font-semibold transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                  outside && "text-muted-foreground/45",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isToday
                      ? "border border-gold/70 bg-gold/10 text-gold-foreground dark:text-gold"
                      : "hover:bg-secondary",
                )}
              >
                {toBnDigits(day.bengaliDay)}
              </button>
            );
          })}
        </div>

        {/* ——— আজ + পরিষ্কার ——— */}
        <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
          <button
            type="button"
            onClick={() => pickDay(todayWire())}
            className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-[12px] font-bold text-gold-foreground transition-colors hover:border-gold hover:bg-gold/20 dark:text-gold"
          >
            আজ
          </button>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="rounded-full px-3 py-1 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            পরিষ্কার
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Cell list for the month view — Bengali month days, leading/trailing neighbours included. */
function buildMonthGrid(viewMonth: BengaliDate): { wire: string; bengaliDay: number; month: number }[] {
  const length = bengaliMonthLength(viewMonth.year, viewMonth.month);
  const firstWire = bengaliToWire({ year: viewMonth.year, month: viewMonth.month, day: 1 });
  const firstDate = new Date(`${firstWire}T00:00:00Z`);
  const leading = firstDate.getUTCDay(); // Sun-first weekday index
  const cells: { wire: string; bengaliDay: number; month: number }[] = [];
  for (let i = leading; i > 0; i--) {
    const date = new Date(firstDate.getTime() - i * DAY_MS);
    cells.push({ wire: dateToWire(date), bengaliDay: gregorianToBengali(date).day, month: viewMonth.month - 1 || 12 });
  }
  for (let day = 1; day <= length; day++) {
    cells.push({ wire: bengaliToWire({ year: viewMonth.year, month: viewMonth.month, day }), bengaliDay: day, month: viewMonth.month });
  }
  while (cells.length % 7 !== 0) {
    const last = new Date(`${cells[cells.length - 1].wire}T00:00:00Z`);
    const date = new Date(last.getTime() + DAY_MS);
    cells.push({ wire: dateToWire(date), bengaliDay: gregorianToBengali(date).day, month: (viewMonth.month % 12) + 1 });
  }
  return cells;
}

/** The trigger's display: Bengali date (e.g. "১৫ জ্যৈষ্ঠ ১৪৩২ বঙ্গাব্দ"). */
function WireDisplay({ wire }: { wire: string }) {
  const date = new Date(`${wire}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return <span className="text-muted-foreground/70">তারিখ বাছুন</span>;
  const bengali = gregorianToBengali(date);
  return <span>{`${toBnDigits(bengali.day)} ${BENGALI_MONTHS_BN[bengali.month - 1]} ${toBnDigits(bengali.year)} বঙ্গাব্দ`}</span>;
}
