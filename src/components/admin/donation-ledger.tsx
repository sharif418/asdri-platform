"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  CircleDashed,
  HandHeart,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DonationStatusCell } from "@/components/admin/donation-status-cell";
import { toast } from "@/hooks/use-toast";
import { daysAgoLabel, formatDate, formatTaka, toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Language } from "@/types";

export type DonationFundType = "zakat" | "general" | "scholarship" | "sponsor";
export type DonationStatus = "initiated" | "completed";

export interface AdminDonationRow {
  id: string;
  receiptNo: string;
  fundType: DonationFundType;
  amount: number;
  currency: string;
  donorName: string;
  email: string;
  phone: string | null;
  anonymous: boolean;
  studentRef: string | null;
  recurring: boolean;
  message: string | null;
  status: DonationStatus;
  campaignTitle: string | null;
  createdAt: string;
}

interface DonationLedgerProps {
  rows: AdminDonationRow[];
  lang: Language;
  totals: { completedAmount: number; initiatedCount: number; completedCount: number };
}

type FilterKey = "all" | DonationStatus;

const FUND_LABELS: Record<DonationFundType, { bn: string; en: string }> = {
  zakat: { bn: "যাকাত", en: "Zakat" },
  general: { bn: "সাধারণ", en: "General" },
  scholarship: { bn: "বৃত্তি", en: "Scholarship" },
  sponsor: { bn: "স্পন্সর", en: "Sponsor" },
};

function fundBadgeClass(fund: DonationFundType): string {
  switch (fund) {
    case "zakat":
      return "border-gold/40 bg-gold/15 text-gold";
    case "scholarship":
      return "border-primary/30 bg-primary/10 text-primary dark:text-gold";
    case "sponsor":
      return "border-emerald-600/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

/** Donation ledger: summary cards, status filter, search, expandable receipts, status transitions. */
export function DonationLedger({ rows, lang, totals }: DonationLedgerProps) {
  const bn = lang === "bn";
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Optimistic status patches — survive Router Cache staleness after PATCH. */
  const [statusPatches, setStatusPatches] = useState<Map<string, DonationStatus>>(() => new Map());

  const effective = useMemo(() => {
    if (statusPatches.size === 0) return rows;
    return rows.map((row) => {
      const patch = statusPatches.get(row.id);
      return patch && patch !== row.status ? { ...row, status: patch } : row;
    });
  }, [rows, statusPatches]);

  /** Server totals re-based onto the optimistic status patches. */
  const adjustedTotals = useMemo(() => {
    if (statusPatches.size === 0) return totals;
    let { completedAmount, completedCount, initiatedCount } = totals;
    for (const [id, status] of statusPatches) {
      const row = rows.find((candidate) => candidate.id === id);
      if (!row || row.status === status) continue;
      if (status === "completed") {
        completedAmount += row.amount;
        completedCount += 1;
        initiatedCount -= 1;
      } else {
        completedAmount -= row.amount;
        completedCount -= 1;
        initiatedCount += 1;
      }
    }
    return { completedAmount, completedCount, initiatedCount };
  }, [rows, totals, statusPatches]);

  async function onStatusChange(row: AdminDonationRow, status: DonationStatus): Promise<void> {
    if (busyId) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/donations/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload: { data?: { message?: string }; error?: string } = await res.json();
      if (!res.ok) {
        toast({ title: payload.error ?? (bn ? "স্ট্যাটাস বদলানো যায়নি" : "Status update failed"), variant: "destructive" });
        return;
      }
      setStatusPatches((prev) => {
        const next = new Map(prev);
        next.set(row.id, status);
        return next;
      });
      toast({
        title: payload.data?.message ?? (bn ? "স্ট্যাটাস হালনাগাদ হয়েছে" : "Status updated"),
        description: `${row.receiptNo} · ${formatTaka(row.amount, lang)}`,
      });
      router.refresh();
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  const needle = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = effective;
    if (filter !== "all") list = list.filter((row) => row.status === filter);
    if (needle) {
      list = list.filter((row) =>
        [row.receiptNo, row.donorName, row.email, row.campaignTitle ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }
    return list;
  }, [effective, filter, needle]);

  const sumVisible = useMemo(
    () => filtered.reduce((sum, row) => sum + row.amount, 0),
    [filtered],
  );

  return (
    <section aria-label={bn ? "অনুদান খাতাবহি" : "Donation ledger"} className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <HandHeart className="h-5 w-5" />
            </span>
            <p className="text-[12.5px] font-semibold text-muted-foreground">
              {bn ? "সম্পন্ন অনুদান (সর্বমোট)" : "Completed donations (all-time)"}
            </p>
          </div>
          <p className="font-heading mt-3 text-2xl font-bold leading-none text-primary dark:text-gold">
            {formatTaka(adjustedTotals.completedAmount, lang)}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <p className="text-[12.5px] font-semibold text-muted-foreground">
              {bn ? "সম্পন্ন রেকর্ড" : "Completed records"}
            </p>
          </div>
          <p className={cn("font-heading mt-3 text-2xl font-bold leading-none", adjustedTotals.completedCount > 0 && "text-primary dark:text-gold")}>
            {toBnDigits(adjustedTotals.completedCount)}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CircleDashed className="h-5 w-5" />
            </span>
            <p className="text-[12.5px] font-semibold text-muted-foreground">
              {bn ? "অপেক্ষমাণ রেকর্ড" : "Initiated records"}
            </p>
          </div>
          <p className="font-heading mt-3 text-2xl font-bold leading-none">
            {toBnDigits(adjustedTotals.initiatedCount)}
          </p>
        </div>
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={bn ? "রসিদ নম্বর, দাতা বা ক্যাম্পেইন খুঁজুন…" : "Search receipt, donor, or campaign…"}
            aria-label={bn ? "অনুদান অনুসন্ধান" : "Search donations"}
            className="h-11 pl-9 text-[13.5px]"
          />
        </div>
        <div role="group" aria-label={bn ? "স্ট্যাটাস ফিল্টার" : "Status filter"} className="flex flex-wrap items-center gap-2">
          {([
            { key: "all" as const, bn: "সব", en: "All" },
            { key: "completed" as const, bn: "সম্পন্ন", en: "Completed" },
            { key: "initiated" as const, bn: "অপেক্ষমাণ", en: "Initiated" },
          ]).map((chip) => {
            const active = filter === chip.key;
            const count = chip.key === "all" ? effective.length : effective.filter((row) => row.status === chip.key).length;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(chip.key)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[12.5px] font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-gold/50 hover:text-primary",
                )}
              >
                {bn ? chip.bn : chip.en}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10.5px] font-bold", active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ledger */}
      {filtered.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border bg-card text-center shadow-sm">
          {/* Ghosted header strip — hints at the ledger structure even when empty */}
          <div
            aria-hidden
            className="flex items-center justify-between gap-4 border-b bg-muted/40 px-4 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/50 sm:px-5"
          >
            <span className="py-2.5 text-left">{bn ? "রসিদ" : "Receipt"}</span>
            <span className="hidden py-2.5 text-left md:inline">{bn ? "খাত ও পরিমাণ" : "Fund & amount"}</span>
            <span className="py-2.5 text-right">{bn ? "স্ট্যাটাস" : "Status"}</span>
          </div>
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <span aria-hidden className="relative flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-gold/30" />
              <span className="absolute inset-1.5 rounded-full bg-gold/10" />
              <HandHeart className="relative h-6 w-6 text-gold" />
            </span>
            <p className="font-heading mt-4 text-[15px] font-semibold">
              {effective.length === 0
                ? bn
                  ? "এখনো কোনো অনুদান রেকর্ড নেই"
                  : "No donation records yet"
                : bn
                  ? "এই ফিল্টারে কোনো রেকর্ড নেই"
                  : "No records under this filter"}
            </p>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              {bn
                ? "“সহযোগিতা” পৃষ্ঠার অনুদান ফর্ম থেকে তৈরি রসিদগুলো এখানে তালিকাভুক্ত হবে।"
                : "Receipts created from the support-page donation form will be listed here."}
            </p>
            {effective.length === 0 ? (
              <Link
                href="/support"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-gradient px-5 text-[13px] font-bold text-gold-foreground transition-opacity hover:opacity-90"
              >
                <HandHeart aria-hidden className="h-4 w-4" />
                {bn ? "অনুদান পৃষ্ঠা দেখুন" : "View the support page"}
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-left">
            <caption className="sr-only">
              {bn ? `${toBnDigits(filtered.length)} টি অনুদান রেকর্ড, সর্বমোট ${formatTaka(sumVisible, lang)}` : `${filtered.length} donation records, ${formatTaka(sumVisible, lang)}`}
            </caption>
            <thead>
              <tr className="border-b bg-muted/50 text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-3 sm:px-5">
                  {bn ? "রসিদ" : "Receipt"}
                </th>
                <th scope="col" className="px-4 py-3 sm:px-5">
                  {bn ? "খাত ও পরিমাণ" : "Fund & amount"}
                </th>
                <th scope="col" className="hidden px-4 py-3 md:table-cell sm:px-5">
                  {bn ? "দাতা" : "Donor"}
                </th>
                <th scope="col" className="hidden px-4 py-3 lg:table-cell sm:px-5">
                  {bn ? "তারিখ" : "Date"}
                </th>
                <th scope="col" className="px-4 py-3 text-right sm:px-5">
                  <span className="sr-only">{bn ? "স্ট্যাটাস" : "Status"}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/40">
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[12px] font-semibold sm:px-5" dir="ltr">
                    {row.receiptNo}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn("text-[10px] font-bold", fundBadgeClass(row.fundType))}>
                        {bn ? FUND_LABELS[row.fundType].bn : FUND_LABELS[row.fundType].en}
                      </Badge>
                      <span className="font-heading text-[14px] font-bold text-primary dark:text-gold">
                        {formatTaka(row.amount, lang)}
                      </span>
                      {row.recurring ? (
                        <Badge variant="outline" className="border-gold/40 bg-gold/10 text-[9.5px] font-bold text-gold">
                          {bn ? "মাসিক" : "Monthly"}
                        </Badge>
                      ) : null}
                    </div>
                    {row.campaignTitle ? (
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {bn ? "ক্যাম্পেইন: " : "Campaign: "}
                        {row.campaignTitle}
                      </p>
                    ) : null}
                  </td>
                  <td className="hidden max-w-0 px-4 py-3.5 md:table-cell sm:px-5">
                    <p className="truncate text-[13px] font-semibold">
                      {row.anonymous ? (bn ? "অজ্ঞাতনামা দাতা" : "Anonymous donor") : row.donorName}
                    </p>
                    <p dir="ltr" className="truncate text-[11px] text-muted-foreground">{row.email}</p>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3.5 text-[12px] text-muted-foreground lg:table-cell sm:px-5">
                    {formatDate(row.createdAt, lang)}
                  </td>
                  <td className="px-4 py-3.5 text-right sm:px-5">
                    <DonationStatusCell
                      receiptNo={row.receiptNo}
                      status={row.status}
                      lang={lang}
                      pending={busyId === row.id}
                      disabled={busyId !== null}
                      mobileLabel={`${row.anonymous ? (bn ? "অজ্ঞাতনামা" : "Anonymous") : row.donorName} · ${formatDate(row.createdAt, lang)}`}
                      onComplete={() => void onStatusChange(row, "completed")}
                      onReopen={() => void onStatusChange(row, "initiated")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t bg-muted/30 px-4 py-2.5 text-[11.5px] text-muted-foreground sm:px-5">
            {bn
              ? `দেখানো হচ্ছে ${toBnDigits(filtered.length)} টি রেকর্ড · যোগফল ${formatTaka(sumVisible, lang)}`
              : `Showing ${filtered.length} records · total ${formatTaka(sumVisible, lang)}`}
          </p>
        </div>
      )}
    </section>
  );
}
