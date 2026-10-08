import type { TrendPoint } from "@/lib/insights";
import { toBnDigits } from "@/lib/format";
import { formatCompactTaka } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * DonationTrendChart — the 6-month server-rendered SVG bar chart (round-9
 * restore of the round-8 module). Zero client JavaScript: the bars are
 * server-drawn SVG with a gold gradient, the current month wears a ring, each
 * bar carries a <title> tooltip, and an sr-only table carries the same numbers
 * for screen readers.
 */

const GOLD_ID = "insight-trend-gold";

export function DonationTrendChart({ trend }: { trend: TrendPoint[] }) {
  const peak = Math.max(1, ...trend.map((p) => p.total));
  const currentKey = trend.at(-1)?.key;
  const chartH = 140;
  const barW = 34;
  const gap = 18;

  const w = trend.length * (barW + gap) - gap;
  const h = chartH + 34; // room for the month labels

  return (
    <div className="flex flex-wrap items-end gap-5">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-44 w-auto max-w-full"
        role="img"
        aria-label="গত ৬ মাসের সম্পন্ন অনুদানের মাসিক লেখচিত্র"
      >
        <defs>
          <linearGradient id={GOLD_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold, #c9a227)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--gold, #c9a227)" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {trend.map((point, i) => {
          const barH = Math.round((point.total / peak) * chartH);
          const x = i * (barW + gap);
          const y = chartH - barH;
          const isCurrent = point.key === currentKey;
          return (
            <g key={point.key}>
              <title>{`${point.labelBn} ${toBnDigits(point.year)} — ${formatCompactTaka(point.total, "bn")} (${toBnDigits(point.count)}টি সম্পন্ন)`}</title>
              {point.total === 0 ? (
                <rect x={x} y={chartH - 3} width={barW} height={3} rx={1.5} fill="currentColor" opacity={0.18} />
              ) : (
                <>
                  <rect x={x} y={y} width={barW} height={barH} rx={5} fill={`url(#${GOLD_ID})`} />
                  {isCurrent ? (
                    <rect
                      x={x - 3.5}
                      y={y - 3.5}
                      width={barW + 7}
                      height={barH + 7}
                      rx={7.5}
                      fill="none"
                      stroke="var(--gold, #c9a227)"
                      strokeWidth={1.6}
                      opacity={0.85}
                    />
                  ) : null}
                </>
              )}
              <text
                x={x + barW / 2}
                y={chartH + 16}
                textAnchor="middle"
                fontSize={11.5}
                fontWeight={600}
                fill="currentColor"
                opacity={isCurrent ? 1 : 0.62}
              >
                {point.labelBn}
              </text>
              {point.total > 0 ? (
                <text x={x + barW / 2} y={Math.max(11, y - 6)} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="currentColor" opacity={0.85}>
                  {compactNoSymbol(point.total)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>গত ৬ মাসের সম্পন্ন অনুদান</caption>
        <thead>
          <tr>
            <th scope="col">মাস</th>
            <th scope="col">সম্পন্ন অনুদান</th>
            <th scope="col">লেনদেন</th>
          </tr>
        </thead>
        <tbody>
          {trend.map((point) => (
            <tr key={point.key}>
              <th scope="row">{`${point.labelBn} ${toBnDigits(point.year)}`}</th>
              <td>{formatCompactTaka(point.total, "bn")}</td>
              <td>{toBnDigits(point.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function compactNoSymbol(amount: number): string {
  const compact = formatCompactTaka(amount, "bn").replace(/^৳\s*/, "");
  return compact;
}

/** The stat-card delta chip: MoM up/down/flat + নতুন when the previous month was zero. */
export function DeltaChip({
  direction,
  percent,
  className,
}: {
  direction: "up" | "down" | "flat" | "new";
  percent: number | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
        direction === "up" && "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
        direction === "down" && "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
        direction === "flat" && "bg-secondary text-muted-foreground",
        direction === "new" && "bg-gold/15 text-gold-foreground dark:text-gold",
        className,
      )}
    >
      {direction === "up" ? `↑ ${toBnDigits(percent ?? 0)}%` : null}
      {direction === "down" ? `↓ ${toBnDigits(percent ?? 0)}%` : null}
      {direction === "flat" ? "— অপরিবর্তিত" : null}
      {direction === "new" ? "নতুন" : null}
    </span>
  );
}
