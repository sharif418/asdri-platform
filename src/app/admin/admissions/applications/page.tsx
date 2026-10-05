import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApplicationsExportButton } from "@/components/admin/applications-export-button";
import { AdminPager } from "@/components/admin/admin-pager";
import {
  APPLICATION_STATUS_META,
  applicationStatusChip,
  applicationStatusLabel,
} from "@/lib/admission-labels";
import { cn } from "@/lib/utils";
import { formatNumber, toBnDigits } from "@/lib/format";
import type { ApplicationStatus } from "@prisma/client";

export const metadata = { title: "আবেদনসমূহ" };

const PAGE_SIZE = 25;
const STATUS_OPTIONS = Object.keys(APPLICATION_STATUS_META) as ApplicationStatus[];
const FILTER_STATUSES: ApplicationStatus[] = ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "EXAM_SCHEDULED", "EXAM_TAKEN", "INTERVIEW", "ADMITTED", "WAITLISTED", "REJECTED"];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildQuery(base: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(base)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `/admin/admissions/applications?${params.toString()}`;
}

/** The officer's application workflow — filter, review, and jump into detail. */
export default async function AdminApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "admissions")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
  const status = typeof sp.status === "string" && STATUS_OPTIONS.includes(sp.status as ApplicationStatus) ? (sp.status as ApplicationStatus) : undefined;
  const intakeId = typeof sp.intakeId === "string" && sp.intakeId.length > 0 ? sp.intakeId : undefined;
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = {
    ...(status ? { status } : {}),
    ...(intakeId ? { intakeId } : {}),
    ...(q
      ? {
          OR: [
            { fullNameBn: { contains: q, mode: "insensitive" as const } },
            { fullNameEn: { contains: q, mode: "insensitive" as const } },
            { trackingNo: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, rows, counts, intakes, admittedRows] = await Promise.all([
    db.application.count({ where }),
    db.application.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        trackingNo: true,
        fullNameBn: true,
        fullNameEn: true,
        phone: true,
        status: true,
        submittedAt: true,
        intake: { select: { id: true, year: true, seatsTotal: true, course: { select: { code: true } } } },
      },
    }),
    db.application.groupBy({ by: ["status"], _count: { _all: true } }),
    db.intake.findMany({
      orderBy: [{ year: "desc" }, { createdAt: "asc" }],
      select: { id: true, year: true, sessionBn: true, course: { select: { code: true } } },
    }),
    db.application.groupBy({ by: ["intakeId"], where: { status: "ADMITTED" }, _count: { _all: true } }),
  ]);

  const countFor = (value: ApplicationStatus) => counts.find((row) => row.status === value)?._count._all ?? 0;
  const admittedMap = new Map(admittedRows.map((row) => [row.intakeId, row._count._all]));
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/admissions" className="hover:text-primary">
          ভর্তি ব্যবস্থাপনা
        </Link>
        <span aria-hidden className="mx-1.5">
          /
        </span>
        <span className="text-foreground">আবেদনসমূহ</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <ClipboardList aria-hidden className="h-6 w-6 text-primary" />
            আবেদনসমূহ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            অনলাইন আবেদনের অফিসার ওয়ার্কফ্লো — নাম বা ট্র্যাকিং নম্বরে খুঁজুন, স্ট্যাটাসে ফিল্টার করে যাচাই করুন।
          </p>
        </div>
        <ApplicationsExportButton intakeId={intakeId} status={status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11.5px] font-semibold">
        <Link
          href="/admin/admissions/applications"
          className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1", !status ? "bg-primary text-primary-foreground" : "bg-gold/15 text-gold")}
        >
          সব আবেদন <span className="font-bold">{formatNumber(total, "bn")}</span>
        </Link>
        {FILTER_STATUSES.map((value) => {
          const count = countFor(value);
          const active = status === value;
          return (
            <Link
              key={value}
              href={buildQuery({ q: q || undefined, intakeId, status: value }, 1).replace(/[?&]page=1$/, "")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-opacity",
                active ? APPLICATION_STATUS_META[value].chip : "opacity-75 hover:opacity-100",
              )}
            >
              {applicationStatusLabel(value)} <span className="font-bold">{formatNumber(count, "bn")}</span>
            </Link>
          );
        })}
      </div>

      <form className="mt-4 flex flex-wrap gap-2" action="/admin/admissions/applications" method="get">
        <div className="relative min-w-52 flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="নাম বা ট্র্যাকিং নম্বর (ASDRI-…) দিয়ে খুঁজুন…"
            className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border bg-card px-3 py-2 text-sm" aria-label="স্ট্যাটাস ফিল্টার">
          <option value="">সব স্ট্যাটাস</option>
          {FILTER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {applicationStatusLabel(value)}
            </option>
          ))}
        </select>
        <select name="intakeId" defaultValue={intakeId ?? ""} className="rounded-lg border bg-card px-3 py-2 text-sm" aria-label="ইনটেক ফিল্টার">
          <option value="">সব ইনটেক</option>
          {intakes.map((intake) => (
            <option key={intake.id} value={intake.id}>
              {intake.course.code} · {intake.year} {intake.sessionBn ? `· ${intake.sessionBn}` : ""}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          ফিল্টার
        </button>
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-heading text-lg font-bold">কোনো আবেদন পাওয়া যায়নি</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q || status || intakeId ? "ফিল্টার বদলে আবার দেখুন।" : "ইনটেক খোলা থাকলে ওয়েবসাইটের আবেদন ফর্ম থেকে নতুন আবেদন এলে এখানে দেখা যাবে।"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">আবেদনকারী</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">ইনটেক ও আসন</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">মোবাইল</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">জমা</th>
                <th className="px-4 py-3 font-semibold">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const admitted = admittedMap.get(row.intake.id) ?? 0;
                return (
                  <tr key={row.id} className="transition-colors hover:bg-secondary/20">
                    <td className="max-w-xs px-4 py-3">
                      <Link href={`/admin/admissions/applications/${row.id}`} className="block truncate font-medium hover:text-primary">
                        {row.fullNameBn}
                      </Link>
                      <p className="text-[11px] text-muted-foreground" dir="ltr">
                        {row.trackingNo}
                        {row.fullNameEn ? ` · ${row.fullNameEn}` : ""}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <p className="text-[12.5px] font-medium" dir="ltr">
                        {row.intake.course.code} · {toBnDigits(row.intake.year)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.intake.seatsTotal === null
                          ? "আসন: নির্ধারিত নয়"
                          : `ভর্তি ${toBnDigits(admitted)}/${toBnDigits(row.intake.seatsTotal)} আসন`}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-[12.5px] lg:table-cell" dir="ltr">
                      {row.phone}
                    </td>
                    <td className="hidden px-4 py-3 text-[12px] text-muted-foreground lg:table-cell">
                      {new Date(row.submittedAt).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={applicationStatusChip(row.status)}>{applicationStatusLabel(row.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/admissions/applications/${row.id}`}
                        className="text-[12.5px] font-semibold text-primary hover:underline"
                      >
                        বিস্তারিত
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AdminPager
        page={page}
        pageCount={pageCount}
        total={total}
        unit="আবেদন"
        buildHref={(next) => buildQuery({ q: q || undefined, status, intakeId }, next)}
      />
    </div>
  );
}
