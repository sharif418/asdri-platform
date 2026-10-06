import { describe, test, expect } from "bun:test";
import { pageWindow } from "@/lib/pagination";

/**
 * pageWindow — the pure pagination-window math behind SitePagination
 * (notice board, blog). Window shape, ellipsis placement, boundary pages,
 * sibling sizing and clamping are all pinned here without React.
 */

function shape(items: ReturnType<typeof pageWindow>): string {
  return items
    .map((item) => (item.type === "page" ? String(item.page) : "…"))
    .join(" ");
}

describe("pageWindow — window shape", () => {
  test("middle page shows both boundary pages and both ellipses", () => {
    expect(shape(pageWindow(5, 10))).toBe("1 … 3 4 5 6 7 … 10");
  });

  test("first page shows the leading run then an ellipsis to the last page", () => {
    expect(shape(pageWindow(1, 10))).toBe("1 2 3 … 10");
  });

  test("last page shows an ellipsis then the trailing run", () => {
    expect(shape(pageWindow(10, 10))).toBe("1 … 8 9 10");
  });

  test("second page keeps page 1 adjacent (no leading ellipsis)", () => {
    expect(shape(pageWindow(2, 10))).toBe("1 2 3 4 … 10");
  });

  test("penultimate page keeps the last page adjacent (no trailing ellipsis)", () => {
    expect(shape(pageWindow(9, 10))).toBe("1 … 7 8 9 10");
  });
});

describe("pageWindow — ellipsis placement", () => {
  test("a gap of exactly one page renders no ellipsis (4 pages, anywhere)", () => {
    expect(shape(pageWindow(1, 4))).toBe("1 2 3 4");
    expect(shape(pageWindow(2, 4))).toBe("1 2 3 4");
    expect(shape(pageWindow(4, 4))).toBe("1 2 3 4");
  });

  test("five pages from page 1: the run 1-3 plus one ellipsis to 5", () => {
    expect(shape(pageWindow(1, 5))).toBe("1 2 3 … 5");
  });

  test("five pages from page 3: everything fits (1..5)", () => {
    expect(shape(pageWindow(3, 5))).toBe("1 2 3 4 5");
  });

  test("siblings=1 shrinks the window", () => {
    expect(shape(pageWindow(5, 20, { siblings: 1 }))).toBe("1 … 4 5 6 … 20");
  });

  test("siblings=0 shows only boundaries and the current page", () => {
    expect(shape(pageWindow(5, 20, { siblings: 0 }))).toBe("1 … 5 … 20");
  });
});

describe("pageWindow — boundaries and clamping", () => {
  test("current is clamped into [1, totalPages]", () => {
    expect(shape(pageWindow(0, 5))).toBe(shape(pageWindow(1, 5)));
    expect(shape(pageWindow(-7, 5))).toBe(shape(pageWindow(1, 5)));
    expect(shape(pageWindow(99, 5))).toBe(shape(pageWindow(5, 5)));
    expect(shape(pageWindow(999, 5))).toBe("1 … 3 4 5");
  });

  test("single page → just page 1", () => {
    expect(pageWindow(1, 1)).toEqual([{ type: "page", page: 1 }]);
  });

  test("two pages → both, no ellipsis", () => {
    expect(shape(pageWindow(1, 2))).toBe("1 2");
    expect(shape(pageWindow(2, 2))).toBe("1 2");
  });

  test("zero/negative/non-finite totals → empty window", () => {
    expect(pageWindow(1, 0)).toEqual([]);
    expect(pageWindow(1, -3)).toEqual([]);
    expect(pageWindow(1, Number.NaN)).toEqual([]);
  });

  test("every window always contains page 1 and the last page", () => {
    for (const total of [3, 7, 12, 25]) {
      for (let page = 1; page <= total; page += 1) {
        const items = pageWindow(page, total);
        expect(items[0]).toEqual({ type: "page", page: 1 });
        expect(items[items.length - 1]).toEqual({ type: "page", page: total });
        // pages strictly increasing, no duplicates, ellipsis never adjacent to a boundary it duplicates
        const pages = items.filter((item): item is { type: "page"; page: number } => item.type === "page").map((item) => item.page);
        expect(new Set(pages).size).toBe(pages.length);
        for (let i = 1; i < pages.length; i += 1) expect(pages[i]).toBeGreaterThan(pages[i - 1]);
      }
    }
  });
});
