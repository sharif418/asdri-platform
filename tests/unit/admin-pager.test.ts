import { describe, test, expect } from "bun:test";
import { pagerItems } from "@/components/admin/admin-pager";

/** The windowed number line behind the admin pager: 1/last always, ±1 around current, gaps as ellipses. */

function pages(page: number, pageCount: number): number[] {
  return pagerItems(page, pageCount)
    .map((item) => (item.kind === "page" ? item.value : 0))
    .filter((value) => value > 0);
}

function gaps(page: number, pageCount: number): number {
  return pagerItems(page, pageCount).filter((item) => item.kind === "gap").length;
}

describe("pagerItems", () => {
  test("short lists render every page with no gaps", () => {
    expect(pages(1, 1)).toEqual([1]);
    expect(pages(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(gaps(3, 5)).toBe(0);
  });

  test("long lists clamp to first/last plus a window around the current page", () => {
    expect(pages(1, 12)).toEqual([1, 2, 12]);
    expect(gaps(1, 12)).toBe(1);
    expect(pages(12, 12)).toEqual([1, 11, 12]);
    expect(pages(6, 12)).toEqual([1, 5, 6, 7, 12]);
    expect(gaps(6, 12)).toBe(2);
  });

  test("edges of the window never duplicate neighbours", () => {
    // Window would be 1,2,3,4 + last — no gap between 4 and 5 → no ellipsis.
    expect(pages(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(gaps(3, 5)).toBe(0);
    // page 2 of 20: 1,2,3 … 20.
    expect(pages(2, 20)).toEqual([1, 2, 3, 20]);
    expect(gaps(2, 20)).toBe(1);
  });
});
