import { describe, test, expect } from "bun:test";
import {
  APPLICATION_JOURNEY,
  MONTHS_SHORT_BN,
  buildAdmissionsFunnel,
  buildApplicationTrend,
  buildDonationTrend,
  monthOverMonthDelta,
  trendPeak,
} from "@/lib/insights";

/**
 * Round-9 — the dashboard-insights math proofs (restored round-8 module):
 * trends bucket by paidAt month, PENDING never trends, deltas read cleanly,
 * the funnel follows the journey order, and the Bangla short-month labels
 * keep their conjuncts (explicit map — never slice()).
 */

const NOW = new Date("2026-05-15T12:00:00Z"); // fixed clock: the "current month" is May 2026

function paid(monthsAgo: number, day: number, amount: number) {
  return {
    status: "COMPLETED",
    paidAt: new Date(Date.UTC(2026, 4 - monthsAgo, day)),
    amount,
  };
}

describe("buildDonationTrend", () => {
  test("six buckets, oldest first, current month last", () => {
    const trend = buildDonationTrend([], NOW);
    expect(trend.length).toBe(6);
    expect(trend[0].key).toBe("2025-12");
    expect(trend[5].key).toBe("2026-05");
    expect(trend[5].labelBn).toBe("মে");
  });

  test("amounts land in the paidAt month, not createdAt", () => {
    const trend = buildDonationTrend([paid(1, 10, 1000), paid(1, 20, 500)], NOW);
    expect(trend[4].total).toBe(1500); // 2026-04
    expect(trend[4].count).toBe(2);
    expect(trend[5].total).toBe(0);
  });

  test("PENDING never trends — and neither do rows without paidAt", () => {
    const trend = buildDonationTrend(
      [
        { status: "PENDING", paidAt: new Date("2026-05-02T00:00:00Z"), amount: 9999 },
        { status: "COMPLETED", paidAt: null, amount: 8888 },
        paid(0, 3, 700),
      ],
      NOW,
    );
    expect(trend[5].total).toBe(700);
    expect(trend[5].count).toBe(1);
  });

  test("rows outside the 6-month window are dropped", () => {
    const trend = buildDonationTrend([paid(6, 10, 4000), paid(9, 10, 4000), paid(2, 10, 100)], NOW);
    expect(trend.every((p) => p.total <= 100)).toBe(true);
  });

  test("the short-month labels keep their conjuncts (the slice trap)", () => {
    // এপ্রিল sliced to 3 chars would be "এপ্র" — wrong; the map says "এপ্রি"
    const trend = buildDonationTrend([], NOW);
    expect(trend[4].labelBn).toBe("এপ্রি"); // April
    expect(trend[1].labelBn).toBe("জানু"); // January 2026
    expect(MONTHS_SHORT_BN).toEqual([
      "জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন", "জুলা", "আগ", "সেপ্ট", "অক্টো", "নভে", "ডিসে",
    ]);
  });

  test("the year boundary crosses correctly (Dec belongs to last year)", () => {
    const trend = buildDonationTrend([paid(5, 15, 3000)], NOW);
    expect(trend[0].year).toBe(2025);
    expect(trend[0].month).toBe(12);
    expect(trend[0].labelBn).toBe("ডিসে");
    expect(trend[0].total).toBe(3000);
  });
});

describe("monthOverMonthDelta", () => {
  test("growth rounds to a percent", () => {
    const trend = buildDonationTrend([paid(1, 5, 1000), paid(0, 5, 1500)], NOW);
    const delta = monthOverMonthDelta(trend);
    expect(delta.direction).toBe("up");
    expect(delta.percent).toBe(50);
  });

  test("decline reports down", () => {
    const trend = buildDonationTrend([paid(1, 5, 2000), paid(0, 5, 900)], NOW);
    expect(monthOverMonthDelta(trend).direction).toBe("down");
    expect(monthOverMonthDelta(trend).percent).toBe(55);
  });

  test("নতুন when the previous month was zero", () => {
    const trend = buildDonationTrend([paid(0, 5, 1200)], NOW);
    const delta = monthOverMonthDelta(trend);
    expect(delta.direction).toBe("new");
    expect(delta.percent).toBeNull();
  });

  test("flat when both months are zero — or the change rounds to 0%", () => {
    expect(monthOverMonthDelta(buildDonationTrend([], NOW)).direction).toBe("flat");
    const tiny = buildDonationTrend([paid(1, 5, 10000), paid(0, 5, 10030)], NOW);
    expect(monthOverMonthDelta(tiny).direction).toBe("flat");
  });

  test("the chip values carry through (current vs previous)", () => {
    const trend = buildDonationTrend([paid(1, 5, 1000), paid(0, 5, 1250)], NOW);
    const delta = monthOverMonthDelta(trend);
    expect(delta.current).toBe(1250);
    expect(delta.previous).toBe(1000);
  });
});

describe("buildApplicationTrend", () => {
  test("buckets by submittedAt month, one per application", () => {
    const trend = buildApplicationTrend(
      [
        { submittedAt: new Date("2026-05-02T00:00:00Z") },
        { submittedAt: new Date("2026-05-11T00:00:00Z") },
        { submittedAt: new Date("2026-04-20T00:00:00Z") },
      ],
      NOW,
    );
    expect(trend[5].count).toBe(2);
    expect(trend[4].count).toBe(1);
    expect(trend[5].total).toBe(2);
  });

  test("the application delta reads নতুন for a first month with submissions", () => {
    const trend = buildApplicationTrend([{ submittedAt: new Date("2026-05-02T00:00:00Z") }], NOW);
    expect(monthOverMonthDelta(trend).direction).toBe("new");
  });
});

describe("buildAdmissionsFunnel", () => {
  test("seven steps in journey order", () => {
    const funnel = buildAdmissionsFunnel({});
    expect(funnel.length).toBe(7);
    expect(funnel.map((s) => s.status)).toEqual([...APPLICATION_JOURNEY]);
    expect(funnel[0].status).toBe("SUBMITTED");
    expect(funnel[6].status).toBe("ADMITTED");
  });

  test("counts land at their step; missing statuses are zero (the dimmed steps)", () => {
    const funnel = buildAdmissionsFunnel({ SUBMITTED: 4, UNDER_REVIEW: 2, ADMITTED: 3 });
    expect(funnel[0].count).toBe(4);
    expect(funnel[1].count).toBe(2);
    expect(funnel[2].count).toBe(0);
    expect(funnel[6].count).toBe(3);
  });

  test("statuses outside the journey (DRAFT/REJECTED) never enter the rail", () => {
    const funnel = buildAdmissionsFunnel({ DRAFT: 5, REJECTED: 2, SUBMITTED: 1 });
    const names = funnel.map((s) => s.status);
    expect(names).not.toContain("DRAFT");
    expect(names).not.toContain("REJECTED");
    expect(funnel.reduce((sum, s) => sum + s.count, 0)).toBe(1);
  });
});

describe("trendPeak", () => {
  test("the tallest bar, minimum 1 (zero charts never divide by zero)", () => {
    expect(trendPeak(buildDonationTrend([], NOW))).toBe(1);
    expect(trendPeak(buildDonationTrend([paid(1, 5, 4000), paid(3, 5, 9000)], NOW))).toBe(9000);
  });
});
