import type { ApplicationStatus } from "@prisma/client";

/**
 * Dashboard insights — the pure math (round-9 restore of the round-8 module),
 * isolated so tests prove the numbers before the dashboard draws them.
 *
 *   - buildDonationTrend: 6 month buckets, COMPLETED donations by paidAt
 *     (PENDING never trends — money that hasn't arrived isn't income)
 *   - monthOverMonthDelta: the chip on the stat cards ("নতুন" when the
 *     previous month was zero)
 *   - buildAdmissionsFunnel: point-in-time counts per journey step, journey
 *     order fixed by STATUS_FLOW
 */

/** Explicit short-month map — slicing full names breaks conjuncts (এপ্রিল→"এপ্র" is wrong). */
export const MONTHS_SHORT_BN = [
  "জানু",
  "ফেব্রু",
  "মার্চ",
  "এপ্রি",
  "মে",
  "জুন",
  "জুলা",
  "আগ",
  "সেপ্ট",
  "অক্টো",
  "নভে",
  "ডিসে",
] as const;

export interface TrendInput {
  status: string;
  paidAt: Date | null;
  amount: number;
}

export interface TrendPoint {
  key: string; // "2026-04" — stable bucket key
  year: number;
  month: number; // 1–12
  labelBn: string; // "এপ্রি"
  total: number; // BDT
  count: number; // completed donations
}

/** The last `months` buckets (inclusive of the current month), COMPLETED + paidAt only. */
export function buildDonationTrend(rows: TrendInput[], now: Date, months = 6): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>();
  const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, {
      key,
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      labelBn: MONTHS_SHORT_BN[d.getUTCMonth()],
      total: 0,
      count: 0,
    });
  }
  for (const row of rows) {
    if (row.status !== "COMPLETED" || !row.paidAt) continue;
    const paid = new Date(row.paidAt);
    const key = `${paid.getUTCFullYear()}-${String(paid.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue; // outside the window — never trends
    bucket.total += row.amount;
    bucket.count += 1;
  }
  return [...buckets.values()];
}

export interface Delta {
  direction: "up" | "down" | "flat" | "new";
  percent: number | null; // rounded, null when not meaningful
  current: number;
  previous: number;
}

/** Last month vs the month before, for the stat-card chip. */
export function monthOverMonthDelta(trend: TrendPoint[]): Delta {
  const current = trend.at(-1)?.total ?? 0;
  const previous = trend.at(-2)?.total ?? 0;
  if (previous === 0 && current > 0) return { direction: "new", percent: null, current, previous };
  if (previous === 0 && current === 0) return { direction: "flat", percent: null, current, previous };
  const ratio = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(ratio));
  if (rounded === 0) return { direction: "flat", percent: 0, current, previous };
  return { direction: ratio > 0 ? "up" : "down", percent: rounded, current, previous };
}

/** Applications-per-month trend for the new-applications chip (SUBMITTED month = submittedAt month). */
export function buildApplicationTrend(rows: { submittedAt: Date }[], now: Date, months = 6): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>();
  const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, {
      key,
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      labelBn: MONTHS_SHORT_BN[d.getUTCMonth()],
      total: 0,
      count: 0,
    });
  }
  for (const row of rows) {
    const at = new Date(row.submittedAt);
    const key = `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.count += 1;
    bucket.total += 1; // one per application — the chip reads count
  }
  return [...buckets.values()];
}

/** The journey order (shared with the applicant's StatusTrack). */
export const APPLICATION_JOURNEY: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "EXAM_SCHEDULED",
  "EXAM_TAKEN",
  "INTERVIEW",
  "ADMITTED",
];

export interface FunnelStep {
  status: ApplicationStatus;
  count: number; // applications currently AT this step
}

/** Point-in-time funnel: who waits where, journey order. */
export function buildAdmissionsFunnel(countsByStatus: Record<string, number>): FunnelStep[] {
  return APPLICATION_JOURNEY.map((status) => ({
    status,
    count: countsByStatus[status] ?? 0,
  }));
}

/** The tallest bar's value for chart scaling (min 1 so zero-charts never divide by zero). */
export function trendPeak(trend: TrendPoint[]): number {
  return Math.max(1, ...trend.map((point) => point.total));
}
