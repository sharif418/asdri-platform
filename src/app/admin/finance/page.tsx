import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  HandCoins,
  History,
  Hourglass,
  Inbox,
  Landmark,
  Mail,
  PiggyBank,
  Target,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { formatTaka, toBnDigits, formatDate } from "@/lib/format";
import { donationStatusChip, donationStatusLabel } from "@/lib/finance-labels";

export const metadata = { title: "আর্থিক বিভাগ" };

function KpiCard({
  icon: Icon,
  value,
  label,
  caption,
  href,
  accent,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  caption: string;
  href: string;
  accent?: "gold" | "emerald";
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent === "gold" ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary"}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight aria-hidden className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="font-heading mt-3 text-2xl font-bold leading-none tracking-tight">{value}</p>
      <p className="mt-1.5 text-[13px] font-semibold">{label}</p>
      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{caption}</p>
    </Link>
  );
}

/** Finance module home — the officer's money board: KPIs, fund breakdown, desks. */
export default async function AdminFinancePage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "finance.manage")) redirect("/admin");

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [raisedTotal, raisedMonth, pendingCount, pendingValue, refundCount, funds, perFund, recent] = await Promise.all([
    db.donation.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    db.donation.aggregate({ where: { status: "COMPLETED", paidAt: { gte: monthStart } }, _sum: { amount: true } }),
    db.donation.count({ where: { status: "PENDING" } }),
    db.donation.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
    db.donation.count({ where: { status: "REFUNDED" } }),
    db.fund.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameBn: true, isEnabled: true } }),
    db.donation.groupBy({ by: ["fundId"], where: { status: "COMPLETED" }, _sum: { amount: true }, _count: { _all: true } }),
    db.donation.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, receiptNo: true, trackingCode: true, donorName: true, isAnonymous: true, amount: true, currency: true, status: true, createdAt: true, fund: { select: { nameBn: true } } },
    }),
  ]);

  const fundMap = new Map(funds.map((f) => [f.id, f]));
  const fundTotal = perFund.reduce((sum, row) => sum + (row._sum.amount ?? 0), 0);
  const maxFundAmount = Math.max(1, ...perFund.map((row) => row._sum.amount ?? 0));

  const kpis: { icon: LucideIcon; value: string; label: string; caption: string; href: string; accent?: "gold" | "emerald" }[] = [
    {
      icon: HandCoins,
      value: formatTaka(raisedTotal._sum.amount ?? 0, "bn"),
      label: "সর্বমোট সংগৃহীত",
      caption: "সব সম্পন্ন অনুদানের যোগফল",
      href: "/admin/finance/donations?status=COMPLETED",
    },
    {
      icon: CalendarClock,
      value: formatTaka(raisedMonth._sum.amount ?? 0, "bn"),
      label: "এ মাসের সংগ্রহ",
      caption: `${formatDate(monthStart.toISOString(), "bn")} থেকে পরিশোধকৃত`,
      href: "/admin/finance/donations",
    },
    {
      icon: Hourglass,
      value: `${toBnDigits(pendingCount)} টি · ${formatTaka(pendingValue._sum.amount ?? 0, "bn")}`,
      label: "অপেক্ষমাণ ইনটেন্ট",
      caption: "পেমেন্টের অপেক্ষায় (ম্যানুয়াল/স্যান্ডবক্স)",
      href: "/admin/finance/donations?status=PENDING",
      accent: "gold",
    },
    {
      icon: Undo2,
      value: toBnDigits(refundCount),
      label: "ফেরতকৃত",
      caption: "সম্পন্ন থেকে ফেরত দেওয়া হয়েছে",
      href: "/admin/finance/donations?status=REFUNDED",
    },
  ];

  const desks: { href: string; icon: LucideIcon; title: string; caption: string; gold?: boolean }[] = [
    { href: "/admin/finance/donations", icon: Banknote, title: "অনুদান তালিকা", caption: "রিসিপ্ট, স্ট্যাটাস ট্রানজিশন, রিসিপ্ট রিসেন্ড, CSV" },
    { href: "/admin/finance/campaigns", icon: Target, title: "ক্যাম্পেইন", caption: "লক্ষ্য, অগ্রগতি, প্রকাশনা ও তারিখ" },
    { href: "/admin/finance/funds", icon: PiggyBank, title: "ফান্ড", caption: "নাম-বর্ণনা, ডিফল্ট, সক্রিয়/নিষ্ক্রিয়, ক্রম" },
    { href: "/admin/finance/ledger", icon: Landmark, title: "ম্যানুয়াল লেজার", caption: "আয়-ব্যয়ের বই, ফান্ডভিত্তিক ব্যালেন্স" },
    { href: "/admin/finance/outbox", icon: Mail, title: "আউটবক্স", caption: "রিসিপ্ট ও চিঠির ইমেইল প্রিভিউ, রিসেন্ড" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
          <HandCoins aria-hidden className="h-6 w-6 text-primary" />
          আর্থিক বিভাগ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          অনুদান, ক্যাম্পেইন, ফান্ড, ম্যানুয়াল হিসাব ও ইমেইল আউটবক্স — আর্থিক ব্যবস্থাপনার পুরো প্রবাহ এই মডিউলে।
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Per-fund breakdown */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <PiggyBank aria-hidden className="h-4 w-4 text-primary" />
              ফান্ডভিত্তিক সংগ্রহ
            </h2>
            <Link href="/admin/finance/funds" className="text-xs font-semibold text-primary hover:underline">
              ফান্ড ব্যবস্থাপনা
            </Link>
          </div>
          <ul className="mt-4 space-y-3.5">
            {perFund.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                এখনো কোনো সম্পন্ন অনুদান নেই — স্যান্ডবক্স চেকআউট বা ম্যানুয়াল কনফার্মেশনের পর এখানে দেখা যাবে।
              </li>
            )}
            {perFund.map((row) => {
              const fund = fundMap.get(row.fundId);
              const amount = row._sum.amount ?? 0;
              const pct = Math.round((amount / maxFundAmount) * 100);
              return (
                <li key={row.fundId}>
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="min-w-0 truncate font-semibold">{fund?.nameBn ?? "ফান্ড"}</span>
                    <span className="shrink-0 font-bold text-primary">{formatTaka(amount, "bn")}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${fund?.nameBn ?? "ফান্ড"} সংগ্রহ`}>
                    <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(pct, 3)}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {toBnDigits(row._count._all)} টি অনুদান
                    {fund && !fund.isEnabled ? " · নিষ্ক্রিয় ফান্ড" : ""}
                  </p>
                </li>
              );
            })}
            {perFund.length > 0 && (
              <li className="flex items-baseline justify-between gap-2 border-t pt-3 text-[13px]">
                <span className="font-semibold">সর্বমোট</span>
                <span className="font-bold text-primary">{formatTaka(fundTotal, "bn")}</span>
              </li>
            )}
          </ul>
        </section>

        {/* Module desks */}
        <section className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {desks.map((desk) => (
              <Link
                key={desk.href}
                href={desk.href}
                className="group flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
              >
                <span className="flex items-center gap-4">
                  <span aria-hidden className={`flex h-11 w-11 items-center justify-center rounded-xl ${desk.gold ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary"}`}>
                    <desk.icon className="h-5.5 w-5.5" />
                  </span>
                  <span>
                    <span className="font-heading block text-[14.5px] font-bold">{desk.title}</span>
                    <span className="text-[12px] text-muted-foreground">{desk.caption}</span>
                  </span>
                </span>
                <ArrowRight aria-hidden className="h-4.5 w-4.5 text-gold opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Recent donations */}
      <section className="mt-8 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <History aria-hidden className="h-4 w-4 text-primary" />
            সর্বশেষ অনুদান
          </h2>
          <Link href="/admin/finance/donations" className="text-xs font-semibold text-primary hover:underline">
            পুরো লেজার দেখুন
          </Link>
        </div>
        <ul className="mt-4 divide-y">
          {recent.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              এখনো কোনো অনুদান আসেনি — ওয়েবসাইটের সাপোর্ট পেজ থেকে প্রথমটি জমা হলে এখানে দেখা যাবে।
            </li>
          )}
          {recent.map((donation) => (
            <li key={donation.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium">
                  {donation.donorName}
                  {donation.isAnonymous && (
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">গোপন</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground" dir="ltr">
                  {donation.receiptNo} · {donation.fund.nameBn}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <span className="hidden text-[12px] font-bold text-primary sm:inline" dir="ltr">
                  {formatTaka(donation.amount, "bn")}
                </span>
                <span className={donationStatusChip(donation.status)}>{donationStatusLabel(donation.status)}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-1.5 border-t pt-3 text-[11px] text-muted-foreground">
          <Inbox aria-hidden className="h-3.5 w-3.5" />
          গোপন অনুদানের দাতার নাম কর্মীরা দেখতে পান — প্রকাশ্য তালিকায় কখনোই নয়।
        </p>
      </section>
    </div>
  );
}
