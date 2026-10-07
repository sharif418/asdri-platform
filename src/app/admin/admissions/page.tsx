import Link from "next/link";
import { ArrowRight, CalendarRange, ClipboardList, FileCheck2, Hourglass, ListFilter, Sparkles, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { applicationStatusChip, applicationStatusLabel } from "@/lib/admission-labels";
import { formatDate, formatNumber, toBnDigits } from "@/lib/format";

export const metadata = { title: "ভর্তি ব্যবস্থাপনা" };

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

/** Admissions module home — officer's KPI board and the two working desks. */
export default async function AdminAdmissionsPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "admissions.manage")) redirect("/admin");

  const [total, submitted, shortlisted, admitted, intakeRows, admittedRows, recent] = await Promise.all([
    db.application.count(),
    db.application.count({ where: { status: "SUBMITTED" } }),
    db.application.count({ where: { status: "SHORTLISTED" } }),
    db.application.count({ where: { status: "ADMITTED" } }),
    db.intake.findMany({ where: { status: "OPEN" }, select: { id: true, seatsTotal: true } }),
    db.application.groupBy({ by: ["intakeId"], where: { status: "ADMITTED" }, _count: { _all: true } }),
    db.application.findMany({
      take: 6,
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        trackingNo: true,
        fullNameBn: true,
        status: true,
        submittedAt: true,
        intake: { select: { year: true, course: { select: { code: true } } } },
      },
    }),
  ]);

  const admittedMap = new Map(admittedRows.map((row) => [row.intakeId, row._count._all]));
  const openSeats = intakeRows.reduce((sum, intake) => {
    if (intake.seatsTotal === null) return sum;
    return sum + Math.max(0, intake.seatsTotal - (admittedMap.get(intake.id) ?? 0));
  }, 0);

  const kpis: { icon: LucideIcon; value: string; label: string; caption: string; href: string; accent?: "gold" | "emerald"; show: boolean }[] = [
    { icon: ClipboardList, value: formatNumber(total, "bn"), label: "মোট আবেদন", caption: "সব ইনটেক মিলিয়ে", href: "/admin/admissions/applications", show: true },
    { icon: Hourglass, value: formatNumber(submitted, "bn"), label: "নতুন আবেদন", caption: "প্রাথমিক যাচাইয়ের অপেক্ষায়", href: "/admin/admissions/applications?status=SUBMITTED", accent: "gold", show: true },
    { icon: Sparkles, value: formatNumber(shortlisted, "bn"), label: "শর্টলিস্ট", caption: "পরীক্ষার জন্য বাছাইকৃত", href: "/admin/admissions/applications?status=SHORTLISTED", show: true },
    { icon: UserCheck, value: formatNumber(admitted, "bn"), label: "ভর্তি নিশ্চিত", caption: "চূড়ান্ত নির্বাচিত শিক্ষার্থী", href: "/admin/admissions/applications?status=ADMITTED", show: true },
    { icon: FileCheck2, value: formatNumber(openSeats, "bn"), label: "খোলা ইনটেকে ফাঁকা আসন", caption: "চলমান ভর্তি ব্যাচসমূহে", href: "/admin/admissions/intakes", show: true },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
          <ClipboardList aria-hidden className="h-6 w-6 text-primary" />
          ভর্তি ব্যবস্থাপনা
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ইনটেক খোলা-বন্ধ, আবেদন যাচাই, পরীক্ষা ও মৌখিক পরীক্ষার নির্বাচন — ভর্তি কার্যক্রমের পুরো প্রবাহ এই মডিউলে।
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Link
          href="/admin/admissions/intakes"
          className="group flex items-center justify-between rounded-2xl border bg-card p-6 shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
        >
          <span className="flex items-center gap-4">
            <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarRange className="h-6 w-6" />
            </span>
            <span>
              <span className="font-heading block text-[15px] font-bold">ইনটেক ও ব্যাচ</span>
              <span className="text-[12.5px] text-muted-foreground">আসন, সময়সীমা, পরীক্ষার তারিখ ও খোলা-বন্ধ</span>
            </span>
          </span>
          <ArrowRight aria-hidden className="h-5 w-5 text-gold opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
        <Link
          href="/admin/admissions/applications"
          className="group flex items-center justify-between rounded-2xl border bg-card p-6 shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
        >
          <span className="flex items-center gap-4">
            <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 text-gold">
              <ListFilter className="h-6 w-6" />
            </span>
            <span>
              <span className="font-heading block text-[15px] font-bold">আবেদনসমূহ</span>
              <span className="text-[12.5px] text-muted-foreground">অফিসারের ওয়ার্কফ্লো — যাচাই, বাছাই, নির্বাচন</span>
            </span>
          </span>
          <ArrowRight aria-hidden className="h-5 w-5 text-gold opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardList aria-hidden className="h-4 w-4 text-primary" />
            সর্বশেষ আবেদন
          </h2>
          <Link href="/admin/admissions/applications" className="text-xs font-semibold text-primary hover:underline">
            সব দেখুন
          </Link>
        </div>
        <ul className="mt-4 divide-y">
          {recent.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              এখনো কোনো আবেদন জমা হয়নি — ইনটেক খুলে দিলে আবেদন ফর্মে দেখা যাবে।
            </li>
          )}
          {recent.map((application) => (
            <li key={application.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <Link
                  href={`/admin/admissions/applications/${application.id}`}
                  className="block truncate text-[13.5px] font-medium hover:text-primary"
                >
                  {application.fullNameBn}
                </Link>
                <p className="text-[11px] text-muted-foreground" dir="ltr">
                  {application.trackingNo} · {application.intake.course.code} {toBnDigits(application.intake.year)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden text-[11px] text-muted-foreground sm:inline">{formatDate(application.submittedAt, "bn")}</span>
                <span className={applicationStatusChip(application.status)}>{applicationStatusLabel(application.status)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
