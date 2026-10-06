/**
 * Pure pagination-window math — shared by every site listing (notice board,
 * blog). No React, no DB: trivially unit-testable.
 */

export type PageWindowItem = { type: "page"; page: number } | { type: "ellipsis" };

export interface PageWindowOptions {
  /** Pages shown on each side of the current page (default 2). */
  siblings?: number;
}

/**
 * Numbered-page window for a pagination bar: always includes page 1 and the
 * last page, the current page ± `siblings`, and an ellipsis wherever a gap
 * of two or more pages is skipped. Short listings (window fits without
 * ellipsis) render every page. `current` is clamped into [1, totalPages].
 *
 * Examples (siblings = 2):
 *   pageWindow(1, 10)  → 1 2 3 … 10
 *   pageWindow(5, 10)  → 1 … 3 4 5 6 7 … 10
 *   pageWindow(10, 10) → 1 … 8 9 10
 *   pageWindow(2, 4)   → 1 2 3 4
 *   pageWindow(1, 1)   → 1
 *   pageWindow(1, 0)   → (empty)
 */
export function pageWindow(
  current: number,
  totalPages: number,
  options: PageWindowOptions = {},
): PageWindowItem[] {
  const siblings = Math.max(0, options.siblings ?? 2);
  if (!Number.isFinite(totalPages) || totalPages < 1) return [];
  const total = Math.floor(totalPages);
  const cur = Math.min(Math.max(1, Math.floor(current)), total);
  if (total === 1) return [{ type: "page", page: 1 }];

  const start = Math.max(1, cur - siblings);
  const end = Math.min(total, cur + siblings);

  const items: PageWindowItem[] = [];
  if (start > 1) {
    items.push({ type: "page", page: 1 });
    if (start > 2) items.push({ type: "ellipsis" });
  }
  for (let page = start; page <= end; page += 1) {
    items.push({ type: "page", page });
  }
  if (end < total) {
    if (end < total - 1) items.push({ type: "ellipsis" });
    items.push({ type: "page", page: total });
  }
  return items;
}
