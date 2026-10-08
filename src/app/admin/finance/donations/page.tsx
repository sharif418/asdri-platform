import Link from "next/link";
import { redirect } from "next/navigation";
import { Banknote, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { CursorPager } from "@/components/admin/cursor-pager";
import { DonationsTable, type DonationRowData } from "@/components/admin/donations-table";
import { FinanceExportButton } from "@/components/admin/finance-export-button";
import { donationStatusLabel, DONATION_STATUS_META } from "@/lib/finance-labels";
import {
  donationCursorWhere,
  donationNeighborProbes,
  encodeDonationCursor,
  parseDonationCursor,
} from "@/lib/finance/donation-cursor";
import { cn } from "@/lib/utils";
import { formatNumber, formatTaka } from "@/lib/format";
import type { DonationStatus, Prisma } from "@prisma/client";

export const metadata = { title: "অনুদান তালিকা" };

const PAGE_SIZE = 25;
const STATUS_OPTIONS = Object.keys(DONATION_STATUS_META) as DonationStatus[];
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildQuery(base: Record<string, string | undefined>, cursor?: string, dir?: "next" | "prev"): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(base)) {
    if (value) params.set(key, value);
  }
  if (cursor && dir) {
    params.set("cursor", cursor);
    params.set("dir", dir);
  }
  return `/admin/finance/donations?${params.toString()}`;
}

/**
 * The donations ledger — filters, pills, keyset pagination (round 11, C.2:
 * the deep OFFSET walk became chronological cursor windows), officer
 * actions, CSV.
 */
export default async function AdminDonationsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "finance.manage")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
  const status =
    typeof sp.status === "string" && STATUS_OPTIONS.includes(sp.status as DonationStatus) ? (sp.status as DonationStatus) : undefined;
  const fundId = typeof sp.fundId === "string" && sp.fundId.length > 0 ? sp.fundId : undefined;
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : undefined;
  // keyset state (round 11): a malformed cursor degrades to the newest page
  const cursor = parseDonationCursor(typeof sp.cursor === "string" ? sp.cursor : undefined);
  const dir = sp.dir === "prev" ? "prev" : "next";

  const createdAt: Prisma.DateTimeFilter | undefined = (() => {
    if (!month) return undefined;
    const start = new Date(`${month}-01T00:00:00Z`);
    if (Number.isNaN(start.getTime())) return undefined;
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    return { gte: start, lt: end };
  })();

  const filters: Prisma.DonationWhereInput = {
    ...(status ? { status } : {}),
    ...(fundId ? { fundId } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(q
      ? {
          OR: [
            { trackingCode: { contains: q, mode: "insensitive" as const } },
            { receiptNo: { contains: q, mode: "insensitive" as const } },
            { donorName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const where = cursor ? donationCursorWhere(filters, cursor, dir) : filters;

  const [total, windowRows, counts, funds, totals] = await Promise.all([
    db.donation.count({ where: filters }),
    db.donation.findMany({
      where,
      // dir=prev fetches the newer window ascending, then reverses for display
      orderBy: dir === "prev" ? [{ createdAt: "asc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE,
      select: {
        id: true,
        receiptNo: true,
        trackingCode: true,
        amount: true,
        currency: true,
        donorName: true,
        isAnonymous: true,
        donorEmail: true,
        donorPhone: true,
        status: true,
        createdAt: true,
        paidAt: true,
        receiptSentAt: true,
        fund: { select: { nameBn: true } },
        campaign: { select: { titleBn: true } },
      },
    }),
    db.donation.groupBy({ by: ["status"], _count: { _all: true } }),
    db.fund.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameBn: true } }),
    db.donation.groupBy({
      by: ["status"],
      where: { ...filters, status: { in: ["COMPLETED", "PENDING"] } },
      _sum: { amount: true },
    }),
  ]);

  // display order is ALWAYS newest-first, whichever direction produced it
  const rows = dir === "prev" ? [...windowRows].reverse() : windowRows;

  // neighbor probes: anything older/newer beyond this window? (cheap findFirst)
  const probes =
    rows.length > 0
      ? donationNeighborProbes(filters, {
          first: { createdAt: rows[0]!.createdAt, id: rows[0]!.id },
          last: { createdAt: rows[rows.length - 1]!.createdAt, id: rows[rows.length - 1]!.id },
        })
      : null;
  const [olderExists, newerExists] = probes
    ? await Promise.all([
        db.donation.findFirst({ where: probes.older, select: { id: true } }),
        db.donation.findFirst({ where: probes.newer, select: { id: true } }),
      ])
    : [null, null];

  const countFor = (value: DonationStatus) => counts.find((row) => row.status === value)?._count._all ?? 0;
  const sumFor = (value: DonationStatus) => totals.find((row) => row.status === value)?._sum.amount ?? 0;

  const tableRows: DonationRowData[] = rows.map((row) => ({
    id: row.id,
    receiptNo: row.receiptNo,
    trackingCode: row.trackingCode,
    fundName: row.fund.nameBn,
    campaignTitle: row.campaign?.titleBn ?? null,
    amount: row.amount,
    currency: row.currency,
    donorName: row.donorName,
    isAnonymous: row.isAnonymous,
    donorEmail: row.donorEmail,
    donorPhone: row.donorPhone,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    paidAt: row.paidAt?.toISOString() ?? null,
    receiptSentAt: row.receiptSentAt?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/finance" className="hover:text-primary">
          আর্থিক বিভাগ
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">অনুদান তালিকা</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <Banknote aria-hidden className="h-6 w-6 text-primary" />
            অনুদান তালিকা
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            সব অনুদানের লেজার — গোপন অনুদানের দাতার নাম কর্মীরা দেখেন, প্রকাশ্যে কখনোই নয়।
          </p>
        </div>
        <FinanceExportButton
          endpoint="/api/admin/donations/export"
          fallbackName="asdri-donations"
          filters={{ status, fundId, month }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11.5px] font-semibold">
        <Link
          href="/admin/finance/donations"
          aria-current={!status ? "page" : undefined}
          className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1", !status ? "bg-primary text-primary-foreground" : "bg-gold/15 text-gold")}
        >
          সব অনুদান <span className="font-bold">{formatNumber(total, "bn")}</span>
        </Link>
        {STATUS_OPTIONS.map((value) => {
          const count = countFor(value);
          const active = status === value;
          return (
            <Link
              key={value}
              href={buildQuery({ q: q || undefined, fundId, month, status: value })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-opacity",
                active ? DONATION_STATUS_META[value].chip : "opacity-75 hover:opacity-100",
              )}
            >
              {donationStatusLabel(value)} <span className="font-bold">{formatNumber(count, "bn")}</span>
            </Link>
          );
        })}
      </div>
      {counts.length > 0 && (
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          বর্তমান ফিল্টারে: সম্পন্ন {formatTaka(sumFor("COMPLETED"), "bn")} · অপেক্ষমাণ {formatTaka(sumFor("PENDING"), "bn")}
        </p>
      )}

      <form className="mt-4 flex flex-wrap gap-2" action="/admin/finance/donations" method="get">
        <div className="relative min-w-52 flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="রিসিপ্ট/ট্র্যাকিং/দাতার নাম দিয়ে খুঁজুন…"
            className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border bg-card px-3 py-2 text-sm" aria-label="স্ট্যাটাস ফিল্টার">
          <option value="">সব স্ট্যাটাস</option>
          {STATUS_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {donationStatusLabel(value)}
            </option>
          ))}
        </select>
        <select name="fundId" defaultValue={fundId ?? ""} className="rounded-lg border bg-card px-3 py-2 text-sm" aria-label="ফান্ড ফিল্টার">
          <option value="">সব ফান্ড</option>
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.nameBn}
            </option>
          ))}
        </select>
        <input
          type="month"
          name="month"
          defaultValue={month ?? ""}
          className="rounded-lg border bg-card px-3 py-2 text-sm"
          aria-label="মাস ফিল্টার"
        />
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          ফিল্টার
        </button>
      </form>

      <div className="mt-4">
        {tableRows.length === 0 ? (
          <div className="rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
            <p className="font-heading text-lg font-bold">কোনো অনুদান পাওয়া যায়নি</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q || status || fundId || month
                ? "ফিল্টার বদলে আবার দেখুন।"
                : "সাপোর্ট পেজ থেকে প্রথম অনুদান জমা হলে এখানে দেখা যাবে।"}
            </p>
          </div>
        ) : (
          <DonationsTable donations={tableRows} />
        )}
      </div>

      <CursorPager
        shown={tableRows.length}
        total={total}
        unit="অনুদান"
        deep={cursor !== null}
        resetHref={cursor ? buildQuery({ q: q || undefined, status, fundId, month: month ?? undefined }) : null}
        prevHref={
          rows.length > 0 && newerExists
            ? buildQuery(
                { q: q || undefined, status, fundId, month: month ?? undefined },
                encodeDonationCursor({ createdAt: rows[0]!.createdAt, id: rows[0]!.id }),
                "prev",
              )
            : null
        }
        nextHref={
          rows.length > 0 && olderExists
            ? buildQuery(
                { q: q || undefined, status, fundId, month: month ?? undefined },
                encodeDonationCursor({ createdAt: rows[rows.length - 1]!.createdAt, id: rows[rows.length - 1]!.id }),
                "next",
              )
            : null
        }
      />
    </div>
  );
}
