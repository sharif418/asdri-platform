/**
 * Shared ?from=&to= date-range parsing for the admin audit log (page filter
 * and CSV export). Both params are required to form a range: if either is
 * missing or malformed the filter is ignored entirely.
 */

export interface AuditDateRange {
  /** Raw YYYY-MM-DD string (ordered so from ≤ to). */
  from: string;
  /** Raw YYYY-MM-DD string (ordered so from ≤ to). */
  to: string;
  /** Start of the "from" day (inclusive, UTC midnight). */
  start: Date;
  /** End of the "to" day (inclusive, UTC 23:59:59.999). */
  end: Date;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Strict YYYY-MM-DD → UTC-midnight Date (null on any malformation). */
function parseDay(value: string): Date | null {
  if (!DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Parse the from/to search-param pair. Invalid values are ignored (the
 * filter only activates when BOTH sides parse); a reversed range is swapped
 * so the filter stays usable instead of silently matching nothing.
 */
export function parseAuditRange(from: string | undefined, to: string | undefined): AuditDateRange | null {
  if (from === undefined && to === undefined) return null;

  const fromDate = from !== undefined ? parseDay(from) : null;
  const toDate = to !== undefined ? parseDay(to) : null;
  if (!fromDate || !toDate) return null;

  let start = fromDate;
  let end = toDate;
  let fromRaw = from ?? "";
  let toRaw = to ?? "";
  if (fromDate.getTime() > toDate.getTime()) {
    [start, end] = [toDate, fromDate];
    [fromRaw, toRaw] = [toRaw, fromRaw];
  }

  const endOfDay = new Date(end);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return { from: fromRaw, to: toRaw, start, end: endOfDay };
}
